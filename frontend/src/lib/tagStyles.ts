const TAG_PALETTE = [
  {
    badge: 'border border-rose-200/80 bg-rose-100/80 text-rose-700',
    dot: 'bg-rose-400',
  },
  {
    badge: 'border border-sky-200/80 bg-sky-100/80 text-sky-700',
    dot: 'bg-sky-400',
  },
  {
    badge: 'border border-emerald-200/80 bg-emerald-100/80 text-emerald-700',
    dot: 'bg-emerald-400',
  },
  {
    badge: 'border border-amber-200/80 bg-amber-100/80 text-amber-700',
    dot: 'bg-amber-400',
  },
  {
    badge: 'border border-indigo-200/80 bg-indigo-100/80 text-indigo-700',
    dot: 'bg-indigo-400',
  },
  {
    badge: 'border border-fuchsia-200/80 bg-fuchsia-100/80 text-fuchsia-700',
    dot: 'bg-fuchsia-400',
  },
  {
    badge: 'border border-teal-200/80 bg-teal-100/80 text-teal-700',
    dot: 'bg-teal-400',
  },
  {
    badge: 'border border-orange-200/80 bg-orange-100/80 text-orange-700',
    dot: 'bg-orange-400',
  },
  {
    badge: 'border border-lime-200/80 bg-lime-100/80 text-lime-700',
    dot: 'bg-lime-400',
  },
  {
    badge: 'border border-cyan-200/80 bg-cyan-100/80 text-cyan-700',
    dot: 'bg-cyan-400',
  },
  {
    badge: 'border border-violet-200/80 bg-violet-100/80 text-violet-700',
    dot: 'bg-violet-400',
  },
  {
    badge: 'border border-stone-200/80 bg-stone-100/80 text-stone-700',
    dot: 'bg-stone-400',
  },
] as const;

function getPaletteIndex(tag: string) {
  const normalized = tag.toLowerCase();
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash << 5) - hash + normalized.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % TAG_PALETTE.length;
}

export function getTagStyleClasses(tag: string) {
  const palette = TAG_PALETTE[getPaletteIndex(tag)];
  return palette;
}

export function formatTagLabel(tag: string) {
  return tag.replace(/^#/, '');
}
