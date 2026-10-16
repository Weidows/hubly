/**
 * Hugging Face "Device code" OAuth — the native flow (iOS / Android / Expo Go).
 *
 * Why device code on native: it needs no redirect URI, so it works in Expo Go (where an
 * authorization-code flow would require a `exp://` redirect that HF cannot match exactly).
 * Note it is **web-incompatible**: `POST /oauth/device` sends no CORS headers, so browsers are
 * blocked from calling it at all — see `pkce.ts` for the web flow.
 *
 * Verified against the live server (2026-10): the start response carries
 * `device_code`, `user_code`, `verification_uri` and `expires_in: 300`, and has **no** `interval`
 * field; an unapproved poll returns HTTP 400 `{"error":"authorization_pending"}`.
 */
import { HF_OAUTH_BASE } from '@/api/client';

import {
  assertClientId,
  formUrlEncode,
  HF_CLIENT_ID,
  OAuthError,
  toOAuthError,
  type DeviceTokens,
} from './oauth';

export type DeviceAuthorization = {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  verificationUriComplete?: string;
  intervalMs: number;
  expiresInSec: number;
};

export async function startDeviceFlow(clientId = HF_CLIENT_ID): Promise<DeviceAuthorization> {
  assertClientId();
  let res: Response;
  try {
    res = await fetch(`${HF_OAUTH_BASE}/oauth/device`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formUrlEncode({ client_id: clientId }),
    });
  } catch (error) {
    throw toOAuthError(error);
  }

  if (!res.ok) throw new OAuthError(`Device flow start failed (${res.status})`, 'unknown');
  const json = (await res.json()) as {
    device_code: string;
    user_code: string;
    verification_uri: string;
    verification_uri_complete?: string;
    interval?: number;
    expires_in?: number;
  };
  return {
    deviceCode: json.device_code,
    userCode: json.user_code,
    verificationUri: json.verification_uri,
    verificationUriComplete: json.verification_uri_complete,
    intervalMs: (json.interval ?? 5) * 1000,
    expiresInSec: json.expires_in ?? 300,
  };
}

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new OAuthError('cancelled', 'access_denied'));
      },
      { once: true },
    );
  });
}

/**
 * Poll /oauth/token until the user approves the code in their browser.
 * Handles the two documented pending responses (`authorization_pending`, `slow_down`).
 */
export async function pollDeviceToken(options: {
  deviceCode: string;
  clientId?: string;
  intervalMs: number;
  expiresInSec: number;
  signal?: AbortSignal;
}): Promise<DeviceTokens> {
  const clientId = options.clientId ?? HF_CLIENT_ID;
  const deadline = Date.now() + options.expiresInSec * 1000;
  let interval = options.intervalMs;

  while (Date.now() < deadline) {
    await sleep(interval, options.signal);

    let res: Response;
    try {
      res = await fetch(`${HF_OAUTH_BASE}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formUrlEncode({
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
          device_code: options.deviceCode,
          client_id: clientId,
        }),
      });
    } catch (error) {
      // A single network hiccup should not kill a 5-minute sign-in: keep polling, but surface it
      // if the deadline passes.
      await sleep(1000, options.signal).catch(() => undefined);
      if (Date.now() >= deadline) throw toOAuthError(error);
      continue;
    }

    if (res.ok) {
      const json = (await res.json()) as {
        access_token: string;
        token_type?: string;
        expires_in?: number;
        scope?: string;
        id_token?: string;
      };
      return {
        accessToken: json.access_token,
        tokenType: json.token_type ?? 'bearer',
        expiresInSec: json.expires_in,
        scope: json.scope,
        idToken: json.id_token,
      };
    }

    const body = (await res.json().catch(() => ({}))) as { error?: string; error_description?: string };
    switch (body.error) {
      case 'authorization_pending':
        break;
      case 'slow_down':
        interval += 5000;
        break;
      case 'access_denied':
        throw new OAuthError(body.error_description ?? 'Access denied', 'access_denied');
      case 'expired_token':
        throw new OAuthError('This code expired — start again', 'expired_token');
      default:
        throw new OAuthError(body.error_description ?? `Token request failed (${res.status})`, 'unknown');
    }
  }
  throw new OAuthError('This code expired — start again', 'expired_token');
}
