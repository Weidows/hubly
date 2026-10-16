/**
 * Small shared UI primitives. Kept in one file on purpose — they are all a few lines long and
 * every screen needs several of them.
 */
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { radius, spacing, type as typeScale, useTheme } from '@/theme';

export function Chip({
  label,
  tone = 'soft',
  onPress,
  active,
}: {
  label: string;
  tone?: 'soft' | 'solid' | 'outline';
  onPress?: () => void;
  active?: boolean;
}) {
  const { palette } = useTheme();
  const background =
    tone === 'solid' ? palette.ink : tone === 'outline' ? 'transparent' : palette.accentSoft;
  const color = tone === 'solid' ? palette.accent : active ? palette.ink : palette.muted;
  const borderColor = tone === 'outline' ? palette.line : 'transparent';

  const content = (
    <View style={[styles.chip, { backgroundColor: background, borderColor }]}>
      <Text style={[typeScale.tiny, styles.chipText, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );

  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} hitSlop={6} style={({ pressed }) => (pressed ? styles.pressed : null)}>
      {content}
    </Pressable>
  );
}

export function Stat({ icon, value, label }: { icon: string; value: string; label?: string }) {
  const { palette } = useTheme();
  return (
    <View style={styles.stat}>
      <Text style={[typeScale.small, { color: palette.muted }]}>{icon}</Text>
      <Text style={[typeScale.small, styles.statValue, { color: palette.inkSoft }]}>{value}</Text>
      {label ? <Text style={[typeScale.tiny, { color: palette.muted }]}>{label}</Text> : null}
    </View>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
}) {
  const { palette } = useTheme();
  return (
    <View style={styles.segmented}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.segment,
              {
                backgroundColor: active ? palette.ink : palette.surfaceAlt,
                opacity: pressed ? 0.85 : 1,
              },
            ]}>
            <Text
              style={[
                typeScale.tiny,
                styles.segmentText,
                { color: active ? palette.accent : palette.muted },
              ]}
              numberOfLines={1}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Loading({ label }: { label?: string }) {
  const { palette } = useTheme();
  return (
    <View style={styles.center}>
      <ActivityIndicator color={palette.accent} />
      {label ? <Text style={[typeScale.small, { color: palette.muted }]}>{label}</Text> : null}
    </View>
  );
}

export function EmptyState({
  title,
  detail,
  action,
}: {
  title: string;
  detail?: string;
  action?: { label: string; onPress: () => void };
}) {
  const { palette } = useTheme();
  return (
    <View style={styles.center}>
      <Text style={[typeScale.title, { color: palette.ink }]}>{title}</Text>
      {detail ? (
        <Text style={[typeScale.small, styles.centerText, { color: palette.muted }]}>{detail}</Text>
      ) : null}
      {action ? (
        <Pressable onPress={action.onPress} style={styles.linkButton}>
          <Text style={[typeScale.small, { color: palette.ink, fontWeight: '700' }]}>
            {action.label}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ErrorState({ message, onRetry, retryLabel }: { message: string; onRetry?: () => void; retryLabel?: string }) {
  const { palette } = useTheme();
  return (
    <View style={styles.center}>
      <Text style={[typeScale.title, { color: palette.danger }]}>!</Text>
      <Text style={[typeScale.small, styles.centerText, { color: palette.muted }]}>{message}</Text>
      {onRetry ? (
        <Pressable onPress={onRetry} style={styles.linkButton}>
          <Text style={[typeScale.small, { color: palette.ink, fontWeight: '700' }]}>
            {retryLabel ?? 'Retry'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Divider({ style }: { style?: ViewStyle }) {
  const { palette } = useTheme();
  return <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: palette.line }, style]} />;
}

export const ui = StyleSheet.create({
  screenPadding: { paddingHorizontal: spacing.lg },
});

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    alignSelf: 'flex-start',
  },
  chipText: { fontWeight: '700' },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statValue: { fontWeight: '700' },
  segmented: { flexDirection: 'row', gap: spacing.sm },
  segment: {
    paddingVertical: 7,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  segmentText: { fontWeight: '700' },
  pressed: { opacity: 0.7 },
  center: { alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: 40 },
  centerText: { textAlign: 'center', maxWidth: 300 },
  linkButton: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
});
