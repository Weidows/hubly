import { hf } from './client';
import type { BlogPost, Page } from './types';

export type ListBlogsParams = { skip?: number; limit?: number; /** 'zh' returns the Chinese blog */ lang?: 'zh' };

/**
 * Blog posts. `/api/blog` returns the global feed, `/api/blog/zh` the Chinese one.
 * Both wrap their payload: `{ allBlogs: [...] }`.
 */
export async function listBlogs(params: ListBlogsParams = {}): Promise<Page<BlogPost>> {
  const limit = params.limit ?? 20;
  const skip = params.skip ?? 0;
  const path = params.lang === 'zh' ? '/api/blog/zh' : '/api/blog';
  const res = await hf<{ allBlogs: BlogPost[] }>(path, { query: { skip, limit } });
  const items = res.allBlogs ?? [];
  return { items, nextSkip: items.length < limit ? null : skip + limit };
}

export async function blogDetail(namespace: string, slug: string) {
  return hf<BlogPost & { content?: string }>(`/api/blog/${namespace}/${slug}`);
}

export async function blogComments(namespace: string, slug: string) {
  return hf<{ comments?: unknown[] }>(`/api/blog/${namespace}/${slug}/comment`);
}

export async function commentOnBlog(slug: string, comment: string) {
  return hf(`/api/blog/${slug}/comment`, { method: 'POST', body: { comment } });
}

/** The "posts" feed: short user updates (`{ socialPosts: [...] }`). */
export async function listSocialPosts(params: { skip?: number; limit?: number } = {}) {
  const limit = params.limit ?? 20;
  const skip = params.skip ?? 0;
  const res = await hf<{ socialPosts: unknown[] }>('/api/posts', { query: { skip, limit } });
  return { items: res.socialPosts ?? [], nextSkip: (res.socialPosts?.length ?? 0) < limit ? null : skip + limit };
}
