/**
 * Hugging Face "Device code" OAuth — no redirect URI, no client secret.
 *
 * Why this flow: the app must sign in on iOS, Android, Expo Go and the web build. An
 * authorization-code + deep-link flow cannot work in Expo Go (the `exp://` redirect carries a
 * changing host, and HF requires custom schemes to match exactly), while device code needs
 * nothing but a client id.
 *
 * Endpoints and field names come from the official guide (huggingface.co/docs/hub/oauth):
 *   POST /oauth/device  {client_id}          -> device_code, user_code, verification_uri, interval, expires_in
 *   POST /oauth/token   grant_type=urn:ietf:params:oauth:grant-type:device_code
 *                       device_code=…&client_id=…
 *
 * The client id is public (a "public app" has no secret) and is injected at build time.
 */
import { HF_OAUTH_BASE } from '@/api/client';

/** Client id of the Hubly OAuth app. Set EXPO_PUBLIC_HF_CLIENT_ID in .env. */
export const HF_CLIENT_ID = process.env.EXPO_PUBLIC_HF_CLIENT_ID ?? '';

export type DeviceAuthorization = {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  verificationUriComplete?: string;
  intervalMs: number;
  expiresInSec: number;
};

export type DeviceTokens = {
  accessToken: string;
  tokenType: string;
  expiresInSec?: number;
  scope?: string;
  idToken?: string;
};

export class DeviceFlowError extends Error {
  constructor(
    message: string,
    readonly code: 'expired_token' | 'access_denied' | 'network' | 'unknown',
  ) {
    super(message);
    this.name = 'DeviceFlowError';
  }
}

function form(data: Record<string, string>) {
  return new URLSearchParams(data).toString();
}

export async function startDeviceFlow(clientId = HF_CLIENT_ID): Promise<DeviceAuthorization> {
  if (!clientId) {
    throw new DeviceFlowError(
      'Missing EXPO_PUBLIC_HF_CLIENT_ID — create a public OAuth app at https://huggingface.co/settings/applications/new',
      'unknown',
    );
  }
  const res = await fetch(`${HF_OAUTH_BASE}/oauth/device`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form({ client_id: clientId }),
  });
  if (!res.ok) throw new DeviceFlowError(`Device flow start failed (${res.status})`, 'unknown');
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
    expiresInSec: json.expires_in ?? 900,
  };
}

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new DeviceFlowError('cancelled', 'access_denied'));
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
    const res = await fetch(`${HF_OAUTH_BASE}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form({
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        device_code: options.deviceCode,
        client_id: clientId,
      }),
    });

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
        throw new DeviceFlowError(body.error_description ?? 'Access denied', 'access_denied');
      case 'expired_token':
        throw new DeviceFlowError('This code expired — start again', 'expired_token');
      default:
        throw new DeviceFlowError(body.error_description ?? `Token request failed (${res.status})`, 'unknown');
    }
  }
  throw new DeviceFlowError('This code expired — start again', 'expired_token');
}
