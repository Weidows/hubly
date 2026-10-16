/**
 * Everything social: discussions, comments, reactions, collections/bookmarks, notifications, users.
 * Write calls require a token carrying `write-discussions` / `write-collections`.
 */
import { hf, getAuthToken } from './client';
import type {
  Collection,
  CollectionItem,
  DiscussionDetail,
  DiscussionStatus,
  DiscussionSummary,
  Notification,
  RepoType,
  User,
} from './types';

const REPO_PATH: Record<RepoType, string> = {
  model: '/api/models',
  dataset: '/api/datasets',
  space: '/api/spaces',
};

const repoBase = (type: RepoType, repoId: string) => `${REPO_PATH[type]}/${repoId}`;

/* ---------------------------------- discussions --------------------------------- */

export type ListDiscussionsParams = {
  p?: number;
  status?: DiscussionStatus | 'all';
  type?: 'discussion' | 'pull_request';
};

export async function listDiscussions(
  repoType: RepoType,
  repoId: string,
  params: ListDiscussionsParams = {},
) {
  const res = await hf<{ discussions: DiscussionSummary[]; count?: number }>(
    `${repoBase(repoType, repoId)}/discussions`,
    { query: { p: params.p ?? 0, status: params.status, type: params.type } },
  );
  return res.discussions ?? [];
}

export async function discussionDetail(repoType: RepoType, repoId: string, num: number) {
  return hf<DiscussionDetail>(`${repoBase(repoType, repoId)}/discussions/${num}`);
}

export async function createDiscussion(
  repoType: RepoType,
  repoId: string,
  body: { title: string; description: string; pullRequest?: boolean },
) {
  return hf(`${repoBase(repoType, repoId)}/discussions`, { method: 'POST', body });
}

export async function commentOnDiscussion(
  repoType: RepoType,
  repoId: string,
  num: number,
  comment: string,
) {
  return hf(`${repoBase(repoType, repoId)}/discussions/${num}/comment`, {
    method: 'POST',
    body: { comment },
  });
}

export async function replyToComment(
  repoType: RepoType,
  repoId: string,
  num: number,
  commentId: string,
  comment: string,
) {
  return hf(`${repoBase(repoType, repoId)}/discussions/${num}/comment/${commentId}/reply`, {
    method: 'POST',
    body: { comment },
  });
}

export async function editComment(
  repoType: RepoType,
  repoId: string,
  num: number,
  commentId: string,
  comment: string,
) {
  return hf(`${repoBase(repoType, repoId)}/discussions/${num}/comment/${commentId}/edit`, {
    method: 'POST',
    body: { comment },
  });
}

export async function reactToComment(
  repoType: RepoType,
  repoId: string,
  num: number,
  commentId: string,
  reaction: string,
) {
  return hf(`${repoBase(repoType, repoId)}/discussions/${num}/comment/${commentId}/reaction`, {
    method: 'POST',
    body: { reaction },
  });
}

export async function setDiscussionStatus(
  repoType: RepoType,
  repoId: string,
  num: number,
  status: DiscussionStatus,
) {
  return hf(`${repoBase(repoType, repoId)}/discussions/${num}/status`, {
    method: 'POST',
    body: { status },
  });
}

export async function togglePinDiscussion(
  repoType: RepoType,
  repoId: string,
  num: number,
  pinned: boolean,
) {
  return hf(`${repoBase(repoType, repoId)}/discussions/${num}/pin`, {
    method: 'POST',
    body: { pinned },
  });
}

/* ---------------------------------- collections --------------------------------- */

export type ListCollectionsParams = {
  owner?: string;
  item?: string;
  q?: string;
  limit?: number;
  skip?: number;
};

export async function listCollections(params: ListCollectionsParams = {}) {
  const res = await hf<{ collections?: Collection[] }>('/api/collections', {
    query: {
      owner: params.owner,
      item: params.item,
      q: params.q,
      limit: params.limit ?? 20,
      skip: params.skip,
    },
  });
  return res.collections ?? [];
}

export async function collectionDetail(namespace: string, slug: string) {
  return hf<Collection>(`/api/collections/${namespace}/${slug}`);
}

export async function createCollection(body: {
  title: string;
  namespace?: string;
  description?: string;
  private?: boolean;
}) {
  return hf<Collection>('/api/collections', { method: 'POST', body });
}

/** A collection item is `{ type, id }` — shape verified only against the read API so far. */
export type NewCollectionItem = { type: RepoType | 'paper' | 'blog'; id: string };

export async function addCollectionItem(
  namespace: string,
  slug: string,
  item: NewCollectionItem,
  note?: string,
) {
  return hf(`/api/collections/${namespace}/${slug}/items`, {
    method: 'POST',
    body: { item, note },
  });
}

export async function removeCollectionItem(namespace: string, slug: string, itemId: string) {
  return hf(`/api/collections/${namespace}/${slug}/items/${itemId}`, { method: 'DELETE' });
}

/* ------------------------------- users & notifications --------------------------- */

export async function whoAmI() {
  return hf<User>('/api/whoami-v2');
}

export async function userOverview(username: string) {
  return hf<User & { numModels?: number; numDatasets?: number; numSpaces?: number }>(
    `/api/users/${username}/overview`,
  );
}

export async function userLikes(username: string) {
  return hf<unknown[]>(`/api/users/${username}/likes`);
}

export async function listNotifications() {
  return hf<Notification[] | { notifications?: Notification[] }>('/api/notifications');
}

/**
 * Mark notifications as read.
 * NOTE: the request body shape is not documented in the OpenAPI spec — confirm it with a live
 * token before wiring this to the UI.
 */
export async function markNotificationsRead(notificationIds: string[]) {
  return hf('/api/notifications/mark-as-read', {
    method: 'POST',
    body: { notificationIds },
  });
}

export function isSignedIn() {
  return getAuthToken() !== null;
}
