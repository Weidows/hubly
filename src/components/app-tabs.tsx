/**
 * Native tab bar (iOS / Android). Expo Router's native tabs render the platform tab bar, so the
 * bar looks like part of the OS; the web build uses its own bar in `app-tabs.web.tsx`.
 * Import path note: SDK 57 exposes this as `expo-router/unstable-native-tabs`; SDK 58 renamed it
 * to `expo-router/native-tabs`. Icon props stay as plain `sf`/`md` strings, which work on both.
 */
import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useT } from '@/i18n';
import { useTheme } from '@/theme';

export default function AppTabs() {
  const t = useT();
  const { palette } = useTheme();

  return (
    <NativeTabs
      backgroundColor={palette.surface}
      indicatorColor={palette.accentSoft}
      labelStyle={{ selected: { color: palette.ink } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{t('tab.repos')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'square.stack', selected: 'square.stack.fill' }}
          md={{ default: 'dashboard', selected: 'dashboard' }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="papers">
        <NativeTabs.Trigger.Label>{t('tab.papers')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'doc.text', selected: 'doc.text.fill' }}
          md={{ default: 'article', selected: 'article' }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="blog">
        <NativeTabs.Trigger.Label>{t('tab.blog')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'newspaper', selected: 'newspaper.fill' }}
          md={{ default: 'feed', selected: 'feed' }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="me">
        <NativeTabs.Trigger.Label>{t('tab.me')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }}
          md={{ default: 'person', selected: 'person' }}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
