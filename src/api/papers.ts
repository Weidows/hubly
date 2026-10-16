import { hf } from './client';
import type { DailyPaper, Page, Paper } from './types';

export type ListPapersParams = {
  sort?: 'trending' | 'publishedAt' | 'upvotes';
  search?: string;
  skip?: number;
  limit?: number;
  author?: string;
};

export async function listPapers(params: ListPapersParams = {}): Promise<Page<Paper>> {
  const limit = params.limit ?? 20;
  const skip = params.skip ?? 0;
  const items = await hf<Paper[]>('/api/papers', {
    query: { sort: params.sort ?? 'trending', search: params.search, skip, limit, author: params.author },
  });
  return { items, nextSkip: items.length < limit ? null : skip + limit };
}

/** "Daily papers" — the curated feed HF shows on huggingface.co/papers. */
export async function dailyPapers(params: { date?: string; week?: string; month?: string; limit?: number; p?: number } = {}) {
  return hf<DailyPaper[]>('/api/daily_papers', { query: { ...params } });
}

export async function searchPapers(query: string, limit = 20) {
  return hf<Paper[]>('/api/papers/search', { query: { q: query, limit } });
}

export async function paperInfo(paperId: string) {
  return hf<Paper>(`/api/papers/${paperId}`);
}

/** Comment on a paper. Needs a token with the `write-discussions` scope. */
export async function commentOnPaper(paperId: string, comment: string) {
  return hf(`/api/papers/${paperId}/comment`, { method: 'POST', body: { comment } });
}
