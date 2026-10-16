/**
 * Web-only OAuth callback: huggingface.co/oauth/authorize redirects here with `?code=…&state=…`.
 * Exchanges the code (PKCE) and hands the token to the auth context, then replaces the URL so the
 * code does not linger in history.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { completeWebSignIn } from '@/auth/pkce';
import { useT } from '@/i18n';
import { spacing, type as typeScale, useTheme } from '@/theme';

export default function AuthCallbackScreen() {
  const t = useT();
  const { palette } = useTheme();
  const { acceptToken } = useAuth();
  const params = useLocalSearchParams<{ code?: string; state?: string; error?: string }>();
  const [failed, setFailed] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // React 18 StrictMode double-invokes effects in dev
    started.current = true;

    (async () => {
      try {
        const tokens = await completeWebSignIn({
          code: typeof params.code === 'string' ? params.code : undefined,
          state: typeof params.state === 'string' ? params.state : undefined,
          error: typeof params.error === 'string' ? params.error : undefined,
        });
        await acceptToken(tokens.accessToken);
        router.replace('/me');
      } catch (err) {
        setFailed(err instanceof Error ? err.message : 'unknown');
      }
    })();
  }, [acceptToken, params.code, params.error, params.state]);

  return (
    <View style={[styles.screen, { backgroundColor: palette.bg }]}>
      <Text style={[typeScale.title, { color: palette.ink }]}>
        {failed ? t('common.error') : t('auth.signingIn')}
      </Text>
      {failed ? <Text style={[typeScale.small, { color: palette.danger }]}>{failed}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
});
