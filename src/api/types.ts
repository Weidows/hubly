/**
 * Types for the bits of the Hub API that Hubly touches.
 * Shapes were read off live API responses (2026-10-16), not from memory — optional fields are
 * genuinely optional because HF omits them depending on the endpoint and the requested `full`/
 * `cardData` flags.
 */

export type RepoType = 'model' | 'dataset' | 'space';

export type RepoAuthor = {
  _id?: string;
  name: string;
  fullname?: string;
  avatarUrl?: string;
  type?: 'user' | 'org';
  isPro?: boolean;
  isHf?: boolean;
  isHfAdmin?: boolean;
  isMod?: boolean;
  isUserFollowing?: boolean;
  followerCount?: number;
  plan?: string;
  details?: string;
};

/** The object returned by /api/models, /api/datasets, /api/spaces list endpoints. */
export type RepoSummary = {
  _id?: string;
  id: string;
  author?: string;
  private?: boolean;
  gated?: boolean | 'auto' | 'manual';
  disabled?: boolean;
  lastModified?: string;
  createdAt?: string;
  likes?: number;
  downloads?: number;
  downloadsAllTime?: number;
  trendingScore?: number;
  tags?: string[];
  pipeline_tag?: string;
  library_name?: string;
  sdk?: string;
  sha?: string;
  description?: string;
  cardData?: {
    license?: string;
    pipeline_tag?: string;
    tags?: string[];
    language?: string[];
    library_name?: string;
    datasets?: string[];
    metrics?: string[];
    base_model?: string | string[];
  };
  /** `full=true` adds siblings (files), config, and the parsed card. */
  siblings?: { rfilename: string }[];
};

export type RepoFile = {
  type: 'file' | 'directory';
  oid: string;
  size: number;
  path: string;
  lfs?: { oid: string; size: number; pointerSize: number } | null;
  lastCommit?: { id: string; title: string; date: string } | null;
};

export type DiscussionStatus = 'open' | 'closed' | 'merged';

export type DiscussionSummary = {
  num: number;
  title: string;
  status: DiscussionStatus;
  createdAt: string;
  author: RepoAuthor;
  repo: { name: string; type: RepoType };
  repoOwner?: { name: string; type?: string; isParticipating?: boolean; isDiscussionAuthor?: boolean };
  isPullRequest: boolean;
  numComments: number;
  numReactionUsers?: number;
  topReactions?: { reaction: string; count: number }[];
  pinned?: boolean;
  locked?: boolean;
};

export type DiscussionEvent = {
  id: string;
  type: 'comment' | 'status-change' | 'reaction' | 'title-change' | 'commit';
  createdAt: string;
  author: RepoAuthor & { isOwner?: boolean; isOrgMember?: boolean };
  /** Only present on `comment` events. `raw` is markdown, `html` is server-rendered. */
  data?: {
    edited?: boolean;
    hidden?: boolean;
    latest?: { raw?: string; html?: string };
    reaction?: string;
  };
};

export type DiscussionDetail = {
  _id?: string;
  num: number;
  title: string;
  status: DiscussionStatus;
  createdAt: string;
  author: RepoAuthor;
  org?: RepoAuthor;
  repo: { name: string; type: RepoType };
  events: DiscussionEvent[];
  pinned?: boolean;
  locked?: boolean;
  isPullRequest?: boolean;
  isReport?: boolean;
  collection?: unknown;
};

export type Paper = {
  id: string;
  title: string;
  authors?: { _id?: string; name: string; hidden?: boolean }[];
  publishedAt?: string;
  submittedOnDailyAt?: string;
  submittedOnDailyBy?: RepoAuthor;
  upvotes?: number;
  thumbnailUrl?: string;
  summary?: string;
  organization?: RepoAuthor;
};

/** /api/daily_papers wraps each paper with submission metadata. */
export type DailyPaper = {
  paper: Paper;
  publishedAt?: string;
  title?: string;
  thumbnail?: string;
  numComments?: number;
  isAuthorParticipating?: boolean;
};

export type BlogPost = {
  _id?: string;
  slug: string;
  title: string;
  author?: RepoAuthor;
  publishedAt?: string;
  editedAt?: string;
  upvotes?: number;
  numCoauthors?: number;
  isUpvotedByUser?: boolean;
  thumbnail?: string;
  /** `true` when the list endpoint returned a stubbed card. */
  isStub?: boolean;
};

export type Collection = {
  slug: string;
  title: string;
  description?: string;
  owner: RepoAuthor;
  gating?: boolean;
  lastUpdated?: string;
  items?: CollectionItem[];
  itemCount?: number;
};

export type CollectionItem = {
  _id: string;
  position?: number;
  type: RepoType | 'paper' | 'blog' | string;
  author?: string;
  id?: string;
  itemId?: string;
  note?: string;
  title?: string;
  repoData?: RepoSummary & { authorData?: RepoAuthor };
};

export type Notification = {
  id: string;
  type?: string;
  createdAt?: string;
  read?: boolean;
  discussionEventId?: string;
  discussion?: {
    num: number;
    title: string;
    repo?: { name: string; type: RepoType };
    isPullRequest?: boolean;
  };
  author?: RepoAuthor;
};

export type User = {
  _id?: string;
  name: string;
  fullname?: string;
  avatarUrl?: string;
  type?: 'user' | 'org';
  isPro?: boolean;
  plan?: string;
  email?: string;
  emailVerified?: boolean;
  canPay?: boolean;
  orgs?: RepoAuthor[];
  followerCount?: number;
  followingCount?: number;
};

/** A page of results plus the cursor maths for `limit`/`skip` pagination. */
export type Page<T> = {
  items: T[];
  /** Value to pass as `skip` for the next page; null when the list ended. */
  nextSkip: number | null;
};
