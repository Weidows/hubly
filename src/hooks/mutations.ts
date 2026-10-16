/**
 * Write operations. Every mutation invalidates the exact queries it can affect — HF rate limits
 * are low enough (1 000 API calls / 5 min signed in) that stale-and-refetch is cheaper than
 * optimistic state that can drift from the server.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { commentOnPaper } from '@/api/papers';
import {
  addCollectionItem,
  commentOnDiscussion,
  createCollection,
  markNotificationsRead,
  reactToComment,
  removeCollectionItem,
  replyToComment,
  type NewCollectionItem,
} from '@/api/social';
import type { RepoType } from '@/api/types';

export function usePostComment(repoType: RepoType, repoId: string, num: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (comment: string) => commentOnDiscussion(repoType, repoId, num, comment),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['discussion', repoType, repoId, num] });
      await queryClient.invalidateQueries({ queryKey: ['discussions', repoType, repoId] });
    },
  });
}

export function useReplyToComment(repoType: RepoType, repoId: string, num: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, comment }: { commentId: string; comment: string }) =>
      replyToComment(repoType, repoId, num, commentId, comment),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['discussion', repoType, repoId, num] });
      await queryClient.invalidateQueries({ queryKey: ['discussions', repoType, repoId] });
    },
  });
}

export function useReactToComment(repoType: RepoType, repoId: string, num: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, reaction }: { commentId: string; reaction: string }) =>
      reactToComment(repoType, repoId, num, commentId, reaction),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['discussion', repoType, repoId, num] });
    },
  });
}

/** Papers have their own comment endpoint, separate from repo discussions. */
export function useCommentOnPaper(paperId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (comment: string) => commentOnPaper(paperId, comment),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['paper-comments', paperId] });
    },
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { title: string; namespace?: string; description?: string; private?: boolean }) =>
      createCollection(body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}

export function useSaveToCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      namespace,
      slug,
      item,
      note,
    }: {
      namespace: string;
      slug: string;
      item: NewCollectionItem;
      note?: string;
    }) => addCollectionItem(namespace, slug, item, note),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}

export function useRemoveCollectionItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ namespace, slug, itemId }: { namespace: string; slug: string; itemId: string }) =>
      removeCollectionItem(namespace, slug, itemId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => markNotificationsRead(ids),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
