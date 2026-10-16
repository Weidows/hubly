import { fetchRepoText, hf } from './client';
import type { Collection, Page, RepoFile, RepoSummary, RepoType } from './types';

const LIST_PATH: Record<RepoType, string> = {
  model: '/api/models',
  dataset: '/api/datasets',
  space: '/api/spaces',
};

const INFO_PATH = LIST_PATH;

export function listPath(type: RepoType) {
  return LIST_PATH[type];
}

export type ListReposParams = {
  search?: string;
  author?: string;
  sort?: 'trendingScore' | 'downloads' | 'likes' | 'lastModified' | 'createdAt';
  direction?: -1 | 1;
  filter?: string;
  pipeline_tag?: string;
  library?: string;
  limit?: number;
  skip?: number;
  full?: boolean;
  cardData?: boolean;
};

/** One page of repos. `limit`/`skip` are the only pagination HF honours (offset is ignored). */
export async function listRepos(type: RepoType, params: ListReposParams = {}): Promise<Page<RepoSummary>> {
  const limit = params.limit ?? 20;
  const skip = params.skip ?? 0;
  const items = await hf<RepoSummary[]>(LIST_PATH[type], {
    query: {
      search: params.search,
      author: params.author,
      sort: params.sort ?? 'trendingScore',
      direction: params.direction ?? (params.sort === 'trendingScore' ? undefined : -1),
      filter: params.filter,
      pipeline_tag: params.pipeline_tag,
      library: params.library,
      limit,
      skip,
      full: params.full,
      cardData: params.cardData,
    },
  });
  return { items, nextSkip: items.length < limit ? null : skip + limit };
}

export async function repoInfo(type: RepoType, repoId: string, full = false) {
  return hf<RepoSummary & { siblings?: { rfilename: string }[]; config?: unknown }>(
    `${INFO_PATH[type]}/${repoId}`,
    { query: { full: full || undefined } },
  );
}

export async function repoFiles(
  type: RepoType,
  repoId: string,
  options: { rev?: string; path?: string; recursive?: boolean; expand?: boolean } = {},
) {
  const rev = options.rev ?? 'main';
  const path = options.path ?? '';
  return hf<RepoFile[]>(`${INFO_PATH[type]}/${repoId}/tree/${rev}/${path}`, {
    query: { recursive: options.recursive, expand: options.expand },
  });
}

export type RepoLiker = { user: string; avatarUrl?: string; fullname?: string };

export async function repoLikers(type: RepoType, repoId: string) {
  const res = await hf<{ likes?: RepoLiker[] } | RepoLiker[]>(
    `${INFO_PATH[type]}/${repoId}/likers`,
  );
  return Array.isArray(res) ? res : (res.likes ?? []);
}

/** The model card / dataset card / Space README, in raw markdown. */
export async function repoReadme(type: RepoType, repoId: string, rev = 'main') {
  return fetchRepoText(type, repoId, 'README.md', rev);
}

/**
 * Collections that already contain a repo.
 * NOTE: the `item` filter is not part of the published OpenAPI spec, so this is written
 * defensively — it degrades to an empty list instead of breaking the detail screen.
 */
export async function collectionsForRepo(type: RepoType, repoId: string) {
  try {
    const res = await hf<{ collections?: Collection[] }>('/api/collections', {
      query: { item: `${type}:${repoId}` },
    });
    return res.collections ?? [];
  } catch {
    return [];
  }
}
