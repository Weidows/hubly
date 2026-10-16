/**
 * Auth state for the whole app: sign-in per platform, token persistence, and the current user.
 * The token never leaves the device — every request goes straight from the app to huggingface.co.
 *
 * Flow per platform (see `oauth.ts` for why):
 *  - native  → device code (`startDeviceFlow` + polling), works in Expo Go
 *  - web     → authorization code + PKCE (`startWebSignIn`), because /oauth/device has no CORS
 */
import { Platform } from 'react-native';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { setAuthToken } from '@/api/client';
import { whoAmI } from '@/api/social';
import type { User } from '@/api/types';

import { pollDeviceToken, startDeviceFlow, type DeviceAuthorization } from './device-flow';
import { OAuthError, toOAuthError, type OAuthErrorCode } from './oauth';
import { startWebSignIn } from './pkce';
import { getItem, removeItem, setItem } from './storage';

const TOKEN_KEY = 'hubly.hf.token';

export type AuthStatus = 'loading' | 'anonymous' | 'signedIn';

export type PendingDevice = Pick<
  DeviceAuthorization,
  'userCode' | 'verificationUri' | 'verificationUriComplete'
>;

export type AuthError = { code: OAuthErrorCode; message: string };

export type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  /** Non-null while a device-code sign-in is waiting for approval (native only). */
  pending: PendingDevice | null;
  error: AuthError | null;
  signIn: () => Promise<void>;
  cancelSignIn: () => void;
  signOut: () => Promise<void>;
  /** Used by the web PKCE callback route once it has exchanged the code for a token. */
  acceptToken: (accessToken: string) => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>');
  return value;
}

export function useAuthState(): AuthContextValue {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [pending, setPending] = useState<PendingDevice | null>(null);
  const [error, setError] = useState<AuthError | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const applySession = useCallback(async (accessToken: string) => {
    setAuthToken(accessToken);
    await setItem(TOKEN_KEY, accessToken);
    const me = await whoAmI();
    setUser(me);
    setStatus('signedIn');
  }, []);

  // Restore a stored token on startup and check who it belongs to.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = await getItem(TOKEN_KEY);
      if (!saved) {
        if (!cancelled) setStatus('anonymous');
        return;
      }
      setAuthToken(saved);
      try {
        const me = await whoAmI();
        if (!cancelled) {
          setUser(me);
          setStatus('signedIn');
        }
      } catch {
        // expired or revoked token: drop it and start clean
        setAuthToken(null);
        await removeItem(TOKEN_KEY);
        if (!cancelled) setStatus('anonymous');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const cancelSignIn = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPending(null);
    setError(null);
  }, []);

  const acceptToken = useCallback(
    async (accessToken: string) => {
      try {
        await applySession(accessToken);
      } catch (err) {
        const oauth = toOAuthError(err);
        setError({ code: oauth.code, message: oauth.message });
        setStatus('anonymous');
      }
    },
    [applySession],
  );

  const signIn = useCallback(async () => {
    setError(null);

    // Web: full-page redirect to /oauth/authorize; the /auth/callback route finishes the job.
    if (Platform.OS === 'web') {
      try {
        await startWebSignIn();
      } catch (err) {
        const oauth = toOAuthError(err);
        setError({ code: oauth.code, message: oauth.message });
      }
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const device = await startDeviceFlow();
      setPending({
        userCode: device.userCode,
        verificationUri: device.verificationUri,
        verificationUriComplete: device.verificationUriComplete,
      });

      const tokens = await pollDeviceToken({
        deviceCode: device.deviceCode,
        intervalMs: device.intervalMs,
        expiresInSec: device.expiresInSec,
        signal: controller.signal,
      });

      await applySession(tokens.accessToken);
    } catch (err) {
      const oauth = err instanceof OAuthError ? err : toOAuthError(err);
      if (oauth.code === 'access_denied') {
        setError(null); // user cancelled on purpose: not an error banner
      } else {
        setError({ code: oauth.code, message: oauth.message });
      }
    } finally {
      abortRef.current = null;
      setPending(null);
    }
  }, [applySession]);

  const signOut = useCallback(async () => {
    cancelSignIn();
    setAuthToken(null);
    await removeItem(TOKEN_KEY);
    setUser(null);
    setStatus('anonymous');
  }, [cancelSignIn]);

  return useMemo(
    () => ({ status, user, pending, error, signIn, cancelSignIn, signOut, acceptToken }),
    [status, user, pending, error, signIn, cancelSignIn, signOut, acceptToken],
  );
}
