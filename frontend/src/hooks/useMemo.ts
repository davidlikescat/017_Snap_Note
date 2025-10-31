import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Memo, CreateMemoInput, UpdateMemoInput, MemoFilters, MemoContext } from '@/types/memo';
import { autoSyncMemoToNotion } from '@/lib/notion';

const QUERY_KEY = 'memos';

function normalizeMemo(row: any): Memo {
  return {
    id: row.id,
    refined: row.refined ?? row.summary ?? '',
    tags: row.tags ?? [],
    context: row.context,
    insight: row.insight ?? null,
    original_text: row.original_text ?? '',
    audio_url: row.audio_url ?? null,
    language: row.language ?? 'en',
    is_deleted: row.is_deleted ?? false,
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? new Date().toISOString(),
    version: row.version ?? 1,
  };
}

// Fetch memos with filters
async function fetchMemos(filters?: MemoFilters): Promise<Memo[]> {
  let query = supabase
    .from('memos')
    .select('*')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters?.tags && filters.tags.length > 0) {
    query = query.overlaps('tags', filters.tags);
  }

  if (filters?.context) {
    query = query.eq('context', filters.context);
  }

  if (filters?.language) {
    query = query.eq('language', filters.language);
  }

  if (filters?.search) {
    query = query.textSearch('search_vector', filters.search);
  }

  // Pagination
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(
      filters.offset,
      filters.offset + (filters.limit || 20) - 1
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error('Fetch memos error:', error);
    throw new Error('Failed to fetch memos');
  }

  return (data ?? []).map(normalizeMemo);
}

// Get single memo by ID
async function fetchMemoById(id: string): Promise<Memo> {
  const { data, error } = await supabase
    .from('memos')
    .select('*')
    .eq('id', id)
    .eq('is_deleted', false)
    .single();

  if (error) {
    console.error('Fetch memo error:', error);
    throw new Error('Memo not found');
  }

  return normalizeMemo(data);
}

// Create new memo
async function createMemo(input: CreateMemoInput): Promise<Memo> {
  const basePayload = {
    tags: input.tags,
    context: input.context,
    insight: input.insight ?? null,
    original_text: input.original_text,
    audio_url: input.audio_url ?? null,
    language: input.language ?? 'en',
  };

  let { data, error } = await supabase
    .from('memos')
    .insert({
      ...basePayload,
      refined: input.refined,
    })
    .select()
    .single();

  if (error && error.message?.toLowerCase().includes('refined')) {
    ({ data, error } = await supabase
      .from('memos')
      .insert({
        ...basePayload,
        summary: input.refined,
      })
      .select()
      .single());
  }

  if (error) {
    console.error('Create memo error:', error);
    throw new Error('Failed to create memo');
  }

  return normalizeMemo(data);
}

// Update existing memo
async function updateMemo(input: UpdateMemoInput): Promise<Memo> {
  const { id, ...updates } = input;

  const payload: Record<string, unknown> = {
    ...(updates.tags ? { tags: updates.tags } : {}),
    ...(updates.context ? { context: updates.context } : {}),
  };

  if (updates.insight !== undefined) {
    payload.insight = updates.insight ?? null;
  }

  if (updates.refined !== undefined) {
    payload.refined = updates.refined;
  }

  let { data, error } = await supabase
    .from('memos')
    .update(payload)
    .eq('id', id)
    .eq('is_deleted', false)
    .select()
    .single();

  if (error && updates.refined !== undefined && error.message?.toLowerCase().includes('refined')) {
    const fallbackPayload = { ...payload };
    delete fallbackPayload.refined;
    fallbackPayload.summary = updates.refined;

    ({ data, error } = await supabase
      .from('memos')
      .update(fallbackPayload)
      .eq('id', id)
      .eq('is_deleted', false)
      .select()
      .single());
  }

  if (error) {
    console.error('Update memo error:', error);
    throw new Error('Failed to update memo');
  }

  return normalizeMemo(data);
}

// Soft delete memo
async function deleteMemo(id: string): Promise<void> {
  const { error } = await supabase
    .from('memos')
    .update({ is_deleted: true })
    .eq('id', id);

  if (error) {
    console.error('Delete memo error:', error);
    throw new Error('Failed to delete memo');
  }
}

// Bulk delete memos
async function bulkDeleteMemos(ids: string[]): Promise<void> {
  const { error } = await supabase
    .from('memos')
    .update({ is_deleted: true })
    .in('id', ids);

  if (error) {
    console.error('Bulk delete memos error:', error);
    throw new Error('Failed to delete memos');
  }
}

// Bulk update context
async function bulkUpdateContext(ids: string[], context: MemoContext): Promise<void> {
  const { error } = await supabase
    .from('memos')
    .update({ context })
    .in('id', ids);

  if (error) {
    console.error('Bulk update context error:', error);
    throw new Error('Failed to update context');
  }
}

// Custom hooks
export function useMemos(filters?: MemoFilters) {
  return useQuery({
    queryKey: [QUERY_KEY, filters],
    queryFn: () => fetchMemos(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useMemo(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => fetchMemoById(id),
    enabled: !!id,
  });
}

export function useCreateMemo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMemo,
    onSuccess: async (data) => {
      // Invalidate and refetch memos list
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });

      // Auto-sync to Notion (non-blocking)
      try {
        await autoSyncMemoToNotion(data);
      } catch (error) {
        console.error('Auto-sync to Notion failed:', error);
        // Don't throw - we don't want to block the UI
      }
    },
  });
}

export function useUpdateMemo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMemo,
    onSuccess: (data) => {
      // Update cache for single memo
      queryClient.setQueryData([QUERY_KEY, data.id], data);
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useDeleteMemo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMemo,
    onSuccess: () => {
      // Invalidate memos list
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useBulkDeleteMemos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bulkDeleteMemos,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useBulkUpdateContext() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, context }: { ids: string[]; context: MemoContext }) =>
      bulkUpdateContext(ids, context),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

// Optimistic update hook
export function useOptimisticCreateMemo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMemo,
    onMutate: async (newMemo) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY] });

      // Snapshot previous value
      const previousMemos = queryClient.getQueryData([QUERY_KEY]);

      // Optimistically update cache
      queryClient.setQueryData([QUERY_KEY], (old: Memo[] | undefined) => {
        const optimisticMemo: Memo = {
          id: 'temp-' + Date.now(),
          refined: newMemo.refined,
          tags: newMemo.tags,
          context: newMemo.context,
          insight: newMemo.insight ?? null,
          original_text: newMemo.original_text,
          audio_url: newMemo.audio_url ?? null,
          language: newMemo.language,
          is_deleted: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          version: 1,
        };

        return old ? [optimisticMemo, ...old] : [optimisticMemo];
      });

      return { previousMemos };
    },
    onError: (err, newMemo, context) => {
      // Rollback on error
      if (context?.previousMemos) {
        queryClient.setQueryData([QUERY_KEY], context.previousMemos);
      }
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}
