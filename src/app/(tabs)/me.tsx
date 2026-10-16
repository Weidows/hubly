import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { webRedirectUri } from '@/auth/pkce';
import { getItem, setItem } from '@/auth/storage';
import { Loading } from '@/components/ui';
import { getLocale, localeStorageKey, setLocale, useT, type Locale } from '@/i18n';
import { font, radius, shadow, spacing, type as typeScale, useTheme } from '@/theme';

export default function MeScreen() {
  const t = useT();
  const { palette } = useTheme();
  const { status, user, pending, error, signIn, cancelSignIn, signOut } = useAuth();
  const [locale, setLocaleState] = useState<Locale>(getLocale());
  const [copied, setCopied] = useState(false);

  const changeLocale = async (next: Locale) => {
    setLocale(next);
    setLocaleState(next);
    await setItem(localeStorageKey, next);
  };

  if (status === 'loading') return <Loading label={t('common.loading')} />;

  return (
    <ScrollView style={{ backgroundColor: palette.bg }} contentContainerStyle={styles.content}>
      <Text style={[typeScale.display, { color: palette.ink, fontWeight: '800' }]}>{t('tab.me')}</Text>

      {user ? (
        <View style={[styles.card, shadow.card, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <View style={styles.userRow}>
            {user.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={[styles.avatar, { backgroundColor: palette.surfaceAlt }]} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={[typeScale.title, { color: palette.ink }]} numberOfLines={1}>
                {user.fullname ?? user.name}
              </Text>
              <Text style={[typeScale.small, { color: palette.muted }]}>@{user.name}</Text>
            </View>
            {user.isPro ? (
              <Text style={[typeScale.tiny, styles.pro, { backgroundColor: palette.accent, color: palette.accentInk }]}>
                PRO
              </Text>
            ) : null}
          </View>

          <View style={styles.statsRow}>
            <Text style={[typeScale.small, { color: palette.muted }]}>
              {user.followerCount ?? 0} followers · {user.followingCount ?? 0} following
            </Text>
          </View>
        </View>
      ) : (
        <View style={[styles.card, shadow.card, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <Text style={[typeScale.small, { color: palette.inkSoft }]}>{t('auth.needsLogin')}</Text>
          <Pressable
            onPress={() => void signIn()}
            disabled={Boolean(pending)}
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: palette.accent, opacity: pressed || pending ? 0.85 : 1 },
            ]}>
            <Text style={[typeScale.body, styles.primaryButtonText, { color: palette.accentInk }]}>
              {t('auth.signIn')}
            </Text>
          </Pressable>
          <Text style={[typeScale.tiny, { color: palette.muted }]}>{t('auth.scopeNote')}</Text>
        </View>
      )}

      {pending ? (
        <View style={[styles.card, shadow.card, { backgroundColor: palette.surface, borderColor: palette.accent }]}>
          <Text style={[typeScale.title, { color: palette.ink }]}>{t('auth.device.title')}</Text>
          <Text style={[typeScale.small, { color: palette.inkSoft }]}>{t('auth.device.instructions')}</Text>

          <Text style={[styles.userCode, { color: palette.ink, fontFamily: font.mono }]}>
            {pending.userCode}
          </Text>

          <View style={styles.buttonRow}>
            <Pressable
              onPress={() => void WebBrowser.openBrowserAsync(pending.verificationUri)}
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: palette.ink, opacity: pressed ? 0.85 : 1 },
              ]}>
              <Text style={[typeScale.small, styles.primaryButtonText, { color: palette.bg }]}>
                {t('auth.device.open')}
              </Text>
            </Pressable>
            <Pressable
              onPress={async () => {
                await Clipboard.setStringAsync(pending.userCode);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              style={({ pressed }) => [
                styles.secondaryButton,
                { borderColor: palette.line, opacity: pressed ? 0.7 : 1 },
              ]}>
              <Text style={[typeScale.small, { color: palette.ink }]}>
                {copied ? t('common.copied') : t('auth.device.copy')}
              </Text>
            </Pressable>
          </View>

          <View style={styles.waitingRow}>
            <Loading label={t('auth.device.waiting')} />
            <Pressable onPress={cancelSignIn} hitSlop={8}>
              <Text style={[typeScale.tiny, { color: palette.danger }]}>{t('common.cancel')}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {error ? (
        <Text style={[typeScale.small, { color: palette.danger }]}>
          {error.code === 'network'
            ? t('auth.error.network')
            : error.code === 'expired_token'
              ? t('auth.error.expired')
              : error.code === 'state_mismatch'
                ? t('auth.error.stateMismatch')
                : `${t('auth.error.generic')} (${error.message})`}
        </Text>
      ) : null}

      {Platform.OS === 'web' && !user ? (
        <Text style={[typeScale.tiny, { color: palette.muted }]}>
          {t('auth.web.note', { uri: webRedirectUri() })}
        </Text>
      ) : null}

      <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <Text style={[typeScale.small, styles.sectionLabel, { color: palette.muted }]}>
          {t('me.language')}
        </Text>
        <View style={styles.buttonRow}>
          <ChoiceButton label="English" active={locale === 'en'} onPress={() => void changeLocale('en')} />
          <ChoiceButton label="中文" active={locale === 'zh'} onPress={() => void changeLocale('zh')} />
        </View>
      </View>

      {user ? (
        <Pressable
          onPress={() => void signOut()}
          style={({ pressed }) => [styles.row, { borderColor: palette.line, opacity: pressed ? 0.7 : 1 }]}>
          <MaterialDesignIcons name="logout" size={16} color={palette.danger} />
          <Text style={[typeScale.small, { color: palette.danger }]}>{t('auth.signOut')}</Text>
        </Pressable>
      ) : null}

      <Text style={[typeScale.tiny, styles.footnote, { color: palette.muted }]}>
        Hubly · unofficial Hugging Face client · no backend, no tracking
      </Text>
    </ScrollView>
  );
}

function ChoiceButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { palette } = useTheme();
  const t = useT();
  void t;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        {
          backgroundColor: active ? palette.ink : palette.surfaceAlt,
          opacity: pressed ? 0.8 : 1,
        },
      ]}>
      <Text style={[typeScale.small, { color: active ? palette.accent : palette.inkSoft, fontWeight: '700' }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 130 },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 46, height: 46, borderRadius: radius.pill },
  pro: { paddingVertical: 3, paddingHorizontal: 7, borderRadius: radius.sm, fontWeight: '800', overflow: 'hidden' },
  statsRow: { flexDirection: 'row' },
  primaryButton: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { fontWeight: '800' },
  secondaryButton: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  buttonRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'stretch' },
  userCode: { fontSize: 30, letterSpacing: 4, fontWeight: '700', textAlign: 'center' },
  waitingRow: { alignItems: 'center', gap: spacing.sm },
  sectionLabel: { fontWeight: '700' },
  choice: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  footnote: { textAlign: 'center' },
});
