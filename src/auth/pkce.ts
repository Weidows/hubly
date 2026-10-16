/**
 * Web sign-in: authorization code + PKCE.
 *
 * Why not the device flow on web: `POST /oauth/device` returns no `Access-Control-Allow-Origin`
 * header (verified), so a browser fetch is blocked and the user sees "Failed to fetch".
 * `/oauth/authorize` is a full-page navigation and `/oauth/token` is CORS-enabled, so the browser
 * can run this flow on its own — no backend.
 *
 * The redirect URI must be registered on the OAuth app. Loopback is special-cased by HF
 * (RFC 8252 §7.3): `http://localhost/auth/callback` matches any port, so dev on :8081 works.
 */
import * as Crypto from 'expo-crypto';

import { getItem, removeItem, setItem } from './storage';
import {
  assertClientId,
  formUrlEncode,
  HF_CLIENT_ID,
  OAuthError,
  OAUTH_SCOPES,
  toOAuthError,
  type DeviceTokens,
} from './oauth';

const VERIFIER_KEY = 'hubly.pkce.verifier';
const STATE_KEY = 'hubly.pkce.state';
const CALLBACK_PATH = '/auth/callback';

/** Only meaningful in a browser. Kept in one place so the redirect is easy to change. */
export function webRedirectUri() {
  if (typeof window === 'undefined') return `http://localhost${CALLBACK_PATH}`;
  return `${window.location.origin}${CALLBACK_PATH}`;
}

function base64Url(bytes: Uint8Array | string): string {
  const raw =
    typeof bytes === 'string'
      ? bytes
      : btoa(String.fromCharCode(...bytes));
  return raw.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function randomUrlSafe(byteLength: number): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(byteLength);
  return base64Url(bytes);
}

async function sha256Challenge(verifier: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, verifier, {
    encoding: Crypto.CryptoEncoding.BASE64,
  });
  return base64Url(digest);
}

export function buildAuthorizeUrl(options: {
  redirectUri: string;
  state: string;
  codeChallenge: string;
  clientId?: string;
}) {
  const params = new URLSearchParams({
    client_id: options.clientId ?? HF_CLIENT_ID,
    redirect_uri: options.redirectUri,
    response_type: 'code',
    scope: OAUTH_SCOPES.join(' '),
    state: options.state,
    code_challenge: options.codeChallenge,
    code_challenge_method: 'S256',
  });
  return `https://huggingface.co/oauth/authorize?${params.toString()}`;
}

/** Navigates the browser away; nothing after this line runs in this page. */
export async function startWebSignIn() {
  assertClientId();
  const verifier = await randomUrlSafe(48);
  const state = await randomUrlSafe(16);
  await setItem(VERIFIER_KEY, verifier);
  await setItem(STATE_KEY, state);

  const url = buildAuthorizeUrl({
    redirectUri: webRedirectUri(),
    state,
    codeChallenge: await sha256Challenge(verifier),
  });
  window.location.assign(url);
}

/** Called by the /auth/callback route with the query parameters HF sent back. */
export async function completeWebSignIn(params: {
  code?: string;
  state?: string;
  error?: string;
}): Promise<DeviceTokens> {
  assertClientId();
  if (params.error) throw new OAuthError(params.error, 'access_denied');

  const verifier = await getItem(VERIFIER_KEY);
  const expectedState = await getItem(STATE_KEY);
  if (!params.code) throw new OAuthError('Missing code in callback', 'unknown');
  if (!verifier || !expectedState) throw new OAuthError('Sign-in was started elsewhere', 'state_mismatch');
  if (params.state !== expectedState) throw new OAuthError('State mismatch', 'state_mismatch');

  try {
    const res = await fetch('https://huggingface.co/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formUrlEncode({
        grant_type: 'authorization_code',
        code: params.code,
        redirect_uri: webRedirectUri(),
        client_id: HF_CLIENT_ID,
        code_verifier: verifier,
      }),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string; error_description?: string };
      throw new OAuthError(
        body.error_description ?? body.error ?? `Token exchange failed (${res.status})`,
        'unknown',
      );
    }

    const json = (await res.json()) as {
      access_token: string;
      token_type?: string;
      expires_in?: number;
      scope?: string;
      id_token?: string;
    };
    await removeItem(VERIFIER_KEY);
    await removeItem(STATE_KEY);
    return {
      accessToken: json.access_token,
      tokenType: json.token_type ?? 'bearer',
      expiresInSec: json.expires_in,
      scope: json.scope,
      idToken: json.id_token,
    };
  } catch (error) {
    throw toOAuthError(error);
  }
}
