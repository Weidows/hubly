/**
 * Web tab bar. The app is mobile-first, so the web build keeps the phone-like bottom bar
 * (centred, max 560px) instead of a desktop top nav — it previews exactly what a device shows.
 */
import {
  MaterialDesignIcons,
  type MaterialDesignIconsIconName,
} from '@react-native-vector-icons/material-design-icons';
import { Tabs, TabList, TabSlot, TabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, StyleSheet, Text, View, type ViewProps } from 'react-native';

import { useT, type TranslationKey } from '@/i18n';
import { radius, spacing, type as typeScale, useTheme } from '@/theme';

type TabDef = { name: string; href: string; label: TranslationKey; icon: MaterialDesignIconsIconName };

const TABS: TabDef[] = [
  { name: 'index', href: '/', label: 'tab.repos', icon: 'view-dashboard-outline' },
  { name: 'papers', href: '/papers', label: 'tab.papers', icon: 'file-document-outline' },
  { name: 'blog', href: '/blog', label: 'tab.blog', icon: 'newspaper-variant-outline' },
  { name: 'me', href: '/me', label: 'tab.me', icon: 'account-circle-outline' },
];

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={styles.slot} />
      <TabList asChild>
        <TabBar>
          {TABS.map((tab) => (
            <TabTrigger key={tab.name} name={tab.name} href={tab.href as never} asChild>
              <TabButton icon={tab.icon} labelKey={tab.label} />
            </TabTrigger>
          ))}
        </TabBar>
      </TabList>
    </Tabs>
  );
}

function TabBar(props: ViewProps) {
  const { palette } = useTheme();
  return (
    <View {...props} style={styles.barWrap}>
      <View style={[styles.bar, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        {props.children}
      </View>
    </View>
  );
}

function TabButton({
  icon,
  labelKey,
  isFocused,
  onPress,
}: TabTriggerSlotProps & {
  icon: MaterialDesignIconsIconName;
  labelKey: TranslationKey;
}) {
  const t = useT();
  const { palette } = useTheme();
  const color = isFocused ? palette.ink : palette.muted;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.tab, pressed ? styles.pressed : null]}>
      <View style={[styles.iconWrap, isFocused ? { backgroundColor: palette.accent } : null]}>
        <MaterialDesignIcons name={icon} size={16} color={isFocused ? palette.accentInk : color} />
      </View>
      <Text style={[typeScale.tiny, { color, fontWeight: isFocused ? '800' : '600' }]}>
        {t(labelKey)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  slot: { height: '100%' },
  barWrap: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: spacing.md,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    width: '100%',
    maxWidth: 560,
    gap: spacing.sm,
  },
  tab: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 2 },
  iconWrap: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 34,
  },
  pressed: { opacity: 0.7 },
});
