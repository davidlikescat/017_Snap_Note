import { useState, useRef, useEffect } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { getTagStyleClasses, formatTagLabel } from '@/lib/tagStyles';

interface TagEditorProps {
  tags: string[];
  availableTags: string[];
  onUpdate: (newTags: string[]) => void;
  maxTags?: number;
}

export default function TagEditor({ tags, availableTags, onUpdate, maxTags = 3 }: TagEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter available tags based on search
  const filteredTags = availableTags.filter((tag) =>
    tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if search query would create a new tag
  const searchQueryFormatted = searchQuery.trim().startsWith('#')
    ? searchQuery.trim()
    : `#${searchQuery.trim()}`;
  const isNewTag =
    searchQuery.trim() &&
    !availableTags.some((tag) => tag.toLowerCase() === searchQueryFormatted.toLowerCase());

  // All options to show
  const options = [
    ...filteredTags.filter((tag) => !tags.includes(tag)),
    ...(isNewTag ? [searchQueryFormatted] : []),
  ];

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => Math.min(prev + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (options[focusedIndex]) {
        handleAddTag(options[focusedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  const handleAddTag = (tag: string) => {
    if (tags.length >= maxTags) {
      return;
    }

    if (!tags.includes(tag)) {
      onUpdate([...tags, tag]);
    }

    setSearchQuery('');
    setFocusedIndex(0);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onUpdate(tags.filter((t) => t !== tagToRemove));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Tags Display */}
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const palette = getTagStyleClasses(tag);
          return (
            <div
              key={tag}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-sm font-medium transition-colors ${palette.badge}`}
            >
              <span className={`h-2 w-2 rounded-full ${palette.dot}`} />
              <span>{formatTagLabel(tag)}</span>
              <button
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-destructive transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}

        {/* Add Tag Button */}
        {tags.length < maxTags && (
          <button
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-sm font-medium transition-colors border border-dashed border-border hover:border-primary hover:bg-primary/5 text-muted-foreground hover:text-primary"
          >
            <Plus className="h-3 w-3" />
            <span>Add tag</span>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full mt-2 left-0 w-64 bg-background border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-hidden flex flex-col">
          {/* Search Input */}
          <div className="p-2 border-b border-border">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setFocusedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search or create..."
              className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Options List */}
          <div className="overflow-y-auto max-h-60">
            {options.length === 0 ? (
              <div className="p-3 text-sm text-center text-muted-foreground">
                {searchQuery.trim() ? 'No tags found' : 'Start typing to search...'}
              </div>
            ) : (
              options.map((tag, index) => {
                const isNewOption = isNewTag && tag === searchQueryFormatted;
                const isSelected = tags.includes(tag);
                const isFocused = index === focusedIndex;
                const palette = getTagStyleClasses(tag);
                const label = formatTagLabel(tag);

                return (
                  <button
                    key={tag}
                    onClick={() => handleAddTag(tag)}
                    disabled={isSelected}
                    className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between transition-colors ${
                      isFocused
                        ? 'bg-primary/10'
                        : 'hover:bg-muted'
                    } ${isSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onMouseEnter={() => setFocusedIndex(index)}
                  >
                    <span className="flex items-center gap-2">
                      {isNewOption && (
                        <span className="text-xs text-muted-foreground">Create:</span>
                      )}
                      <span className={`inline-flex items-center gap-2 ${isNewOption ? 'font-medium' : ''}`}>
                        <span className={`h-2 w-2 rounded-full ${palette.dot}`} />
                        <span>{label}</span>
                      </span>
                    </span>
                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-border bg-muted/50 text-xs text-muted-foreground">
            {tags.length}/{maxTags} tags selected
          </div>
        </div>
      )}
    </div>
  );
}
