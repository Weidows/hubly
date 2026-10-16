/**
 * Auth state for the whole app: device-code sign-in, token persistence, and the current user.
 * The token never leaves the device — every request goes straight from the app to huggingface.co.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { setAuthToken } from '@/api/client';
import { whoAmI } from '@/api/social';
import type { User } from '@/api/types';

import {
  DeviceFlowError,
  pollDeviceToken,
  startDeviceFlow,
  type DeviceAuthorization,
} from './device-flow';
import { getItem, removeItem, setItem } from './storage';

const TOKEN_KEY = 'hubly.hf.token';

export type AuthStatus = 'loading' | 'anonymous' | 'signedIn';

export type PendingDevice = Pick<
  DeviceAuthorization,
  'userCode' | 'verificationUri' | 'verificationUriComplete'
>;

export type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  /** Non-null while a device-code sign-in is waiting for approval. */
  pending: PendingDevice | null;
  error: string | null;
  signIn: () => Promise<void>;
  cancelSignIn: () => void;
  signOut: () => Promise<void>;
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
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

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

  const signIn = useCallback(async () => {
    setError(null);
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

      setAuthToken(tokens.accessToken);
      await setItem(TOKEN_KEY, tokens.accessToken);
      const me = await whoAmI();
      setUser(me);
      setStatus('signedIn');
    } catch (err) {
      if (err instanceof DeviceFlowError && err.code === 'access_denied') {
        setError(null); // user cancelled on purpose: not an error banner
      } else if (err instanceof DeviceFlowError && err.code === 'expired_token') {
        setError('expired');
      } else {
        setError(err instanceof Error ? err.message : 'unknown');
      }
    } finally {
      abortRef.current = null;
      setPending(null);
    }
  }, []);

  const signOut = useCallback(async () => {
    cancelSignIn();
    setAuthToken(null);
    await removeItem(TOKEN_KEY);
    setUser(null);
    setStatus('anonymous');
  }, [cancelSignIn]);

  return useMemo(
    () => ({ status, user, pending, error, signIn, cancelSignIn, signOut }),
    [status, user, pending, error, signIn, cancelSignIn, signOut],
  );
}
