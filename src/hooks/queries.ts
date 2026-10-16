/** React Query hooks. One place for query keys, so invalidation after a write is predictable. */
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { listBlogs } from '@/api/blog';
import { dailyPapers, listPapers } from '@/api/papers';
import { repoFiles, repoInfo, repoReadme } from '@/api/repos';
import { listDiscussions } from '@/api/social';
import type { RepoType } from '@/api/types';
import { listRepos } from '@/api/repos';

const PAGE_SIZE = 20;

export function useRepoFeed(type: RepoType, search: string) {
  return useInfiniteQuery({
    queryKey: ['repos', type, search],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      listRepos(type, {
        search: search || undefined,
        skip: pageParam,
        limit: PAGE_SIZE,
        cardData: true,
      }),
    getNextPageParam: (last) => last.nextSkip ?? undefined,
  });
}

export function useRepoDetail(type: RepoType, repoId: string) {
  return useQuery({
    queryKey: ['repo', type, repoId],
    queryFn: () => repoInfo(type, repoId, true),
    enabled: Boolean(repoId),
  });
}

export function useRepoReadme(type: RepoType, repoId: string) {
  return useQuery({
    queryKey: ['repo-readme', type, repoId],
    queryFn: () => repoReadme(type, repoId),
    enabled: Boolean(repoId),
  });
}

export function useRepoFiles(type: RepoType, repoId: string) {
  return useQuery({
    queryKey: ['repo-files', type, repoId],
    queryFn: () => repoFiles(type, repoId),
    enabled: Boolean(repoId),
  });
}

export function useDiscussions(type: RepoType, repoId: string) {
  return useQuery({
    queryKey: ['discussions', type, repoId],
    queryFn: () => listDiscussions(type, repoId),
    enabled: Boolean(repoId),
  });
}

export type PaperFeedMode = 'daily' | 'trending';

/**
 * Trending papers via /api/papers (offset paging).
 * NOTE the query key must not collide with `useDailyPapers` — different endpoints return
 * different shapes, and sharing a key makes react-query serve one hook the other's data.
 */
export function usePaperFeed(mode: PaperFeedMode) {
  return useInfiniteQuery({
    queryKey: ['papers', 'trending', mode],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => listPapers({ sort: 'trending', skip: pageParam, limit: PAGE_SIZE }),
    getNextPageParam: (last) => last.nextSkip ?? undefined,
    enabled: mode === 'trending',
  });
}

/** Curated feed via /api/daily_papers: an array of `{ paper, publishedAt, thumbnail, … }`. */
export function useDailyPapers() {
  return useQuery({
    queryKey: ['papers', 'daily', 'curated'],
    queryFn: () => dailyPapers({ limit: 30 }),
  });
}

export function useBlogFeed(lang: 'zh' | 'global') {
  return useInfiniteQuery({
    queryKey: ['blogs', lang],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      listBlogs({
        skip: pageParam,
        limit: PAGE_SIZE,
        lang: lang === 'zh' ? 'zh' : undefined,
      }),
    getNextPageParam: (last) => last.nextSkip ?? undefined,
  });
}
