/**
 * Shared OAuth bits for both flows.
 *
 * Flow choice is per platform, and it is not cosmetic:
 *  - **Device code** (native): POST /oauth/device, then poll /oauth/token. No redirect URI, works
 *    in Expo Go. `huggingface.co/oauth/device` sends **no** CORS headers, so a browser cannot use it.
 *  - **Authorization code + PKCE** (web): /oauth/authorize is a top-level navigation (no CORS), and
 *    /oauth/token *is* CORS-enabled (`Access-Control-Allow-Origin: *`), so the browser can exchange
 *    the code itself.
 */
export const HF_CLIENT_ID = process.env.EXPO_PUBLIC_HF_CLIENT_ID ?? '';

/** Least privilege for what Hubly does: identify the user, post comments, manage collections. */
export const OAUTH_SCOPES = ['openid', 'profile', 'write-discussions', 'write-collections'] as const;

export type DeviceTokens = {
  accessToken: string;
  tokenType: string;
  expiresInSec?: number;
  scope?: string;
  idToken?: string;
};

export type OAuthErrorCode =
  | 'expired_token'
  | 'access_denied'
  | 'authorization_pending'
  | 'network'
  | 'state_mismatch'
  | 'redirect_uri_not_registered'
  | 'unknown';

export class OAuthError extends Error {
  constructor(
    message: string,
    readonly code: OAuthErrorCode,
  ) {
    super(message);
    this.name = 'OAuthError';
  }
}

/** form-urlencoded body — both HF token endpoints expect it, not JSON. */
export function formUrlEncode(data: Record<string, string>) {
  return new URLSearchParams(data).toString();
}

/** Turn a fetch-level failure into something a user can act on. */
export function toOAuthError(error: unknown): OAuthError {
  if (error instanceof OAuthError) return error;
  if (error instanceof TypeError) {
    return new OAuthError(
      'Cannot reach huggingface.co — check the network / proxy on this device',
      'network',
    );
  }
  return new OAuthError(error instanceof Error ? error.message : 'unknown', 'unknown');
}

export function assertClientId() {
  if (!HF_CLIENT_ID) {
    throw new OAuthError(
      'Missing EXPO_PUBLIC_HF_CLIENT_ID — see .env.example',
      'unknown',
    );
  }
}
