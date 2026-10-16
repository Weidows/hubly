/**
 * Thin fetch wrapper around the public Hugging Face Hub REST API.
 *
 * Verified facts this file encodes (checked against the live API on 2026-10-16):
 * - Read endpoints work with no token; write endpoints need a bearer token.
 * - Pagination is `limit` + `skip`. `offset` is silently ignored, `cursor` returns 400.
 * - CORS is open (Access-Control-Allow-Origin echoes the Origin), so this runs in browsers too.
 * - huggingface.co is unreachable from mainland China without a proxy, hence the override below.
 */

/**
 * API host. `EXPO_PUBLIC_HF_ENDPOINT` is optional; an *empty* value in .env must fall back to the
 * public Hub, which is why this checks for a non-empty string instead of using `??` — an empty
 * string would otherwise make every request relative and hit the dev server itself.
 */
const configuredEndpoint = process.env.EXPO_PUBLIC_HF_ENDPOINT?.trim();

export const HF_BASE = (
  configuredEndpoint && configuredEndpoint.length > 0 ? configuredEndpoint : 'https://huggingface.co'
).replace(/\/+$/, '');

/** Base of the HF OAuth server (same host as the Hub). */
export const HF_OAUTH_BASE = HF_BASE;

export class HfError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(status: number, code: string | undefined, message: string) {
    super(message);
    this.name = 'HfError';
    this.status = status;
    this.code = code;
  }

  get isAuthError() {
    return this.status === 401 || this.status === 403;
  }

  get isRateLimited() {
    return this.status === 429;
  }
}

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

export type QueryValue = string | number | boolean | undefined | null;

export type HfRequest = {
  query?: Record<string, QueryValue>;
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Override the module-level token (e.g. `null` to force an anonymous call). */
  token?: string | null;
  /** Return the response as text instead of JSON (READMEs, raw files). */
  text?: boolean;
  signal?: AbortSignal;
};

function buildUrl(path: string, query?: Record<string, QueryValue>) {
  if (!query) return HF_BASE + path;
  const parts: string[] = [];
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }
  return parts.length ? `${HF_BASE}${path}?${parts.join('&')}` : HF_BASE + path;
}

async function parseError(res: Response) {
  const text = await res.text().catch(() => '');
  let code: string | undefined;
  let message = text.slice(0, 300) || res.statusText;
  try {
    const json = JSON.parse(text) as { error?: string; message?: string };
    code = json.error;
    message = json.error ?? json.message ?? message;
  } catch {
    // non-JSON error body: keep the raw text
  }
  return new HfError(res.status, code, message);
}

export async function hf<T>(path: string, request: HfRequest = {}): Promise<T> {
  const { query, method = 'GET', body, text, signal } = request;
  const token = request.token === undefined ? authToken : request.token;

  const res = await fetch(buildUrl(path, query), {
    method,
    signal,
    headers: {
      Accept: text ? 'text/plain, */*' : 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) throw await parseError(res);
  if (res.status === 204) return undefined as T;
  return (text ? res.text() : res.json()) as Promise<T>;
}

/**
 * Public "resolve" URL for a file inside a repo (no auth, served straight off the CDN).
 * models:  /{id}/resolve/{rev}/{path}
 * datasets: /datasets/{id}/resolve/{rev}/{path}
 * spaces:  /spaces/{id}/resolve/{rev}/{path}
 */
export function resolveUrl(
  repoType: 'model' | 'dataset' | 'space',
  repoId: string,
  path: string,
  rev = 'main',
) {
  const prefix = repoType === 'model' ? '' : `/${repoType}s`;
  return `${HF_BASE}${prefix}/${repoId}/resolve/${rev}/${path}`;
}

/** Fetch a README / config / any text file from a repo. Returns null when it does not exist. */
export async function fetchRepoText(
  repoType: 'model' | 'dataset' | 'space',
  repoId: string,
  path: string,
  rev = 'main',
): Promise<string | null> {
  const res = await fetch(resolveUrl(repoType, repoId, path, rev), {
    headers: { Accept: 'text/plain, */*' },
  });
  if (!res.ok) return null;
  return res.text();
}
