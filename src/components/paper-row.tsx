import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Paper } from '@/api/types';
import { ui } from '@/components/ui';
import { formatCount, timeAgo } from '@/lib/format';
import { font, radius, spacing, type as typeScale, useTheme } from '@/theme';

export function PaperRow({ paper, onPress }: { paper: Paper; onPress: () => void }) {
  const { palette } = useTheme();
  const authors = paper.authors ?? [];
  const authorLine =
    authors.length > 3
      ? `${authors.slice(0, 3).map((a) => a.name).join(', ')} +${authors.length - 3}`
      : authors.map((a) => a.name).join(', ');

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, { opacity: pressed ? 0.85 : 1 }]}>
      <View style={[styles.thumbWrap, { backgroundColor: palette.surfaceAlt, borderColor: palette.line }]}>
        {paper.thumbnailUrl ? (
          <Image source={{ uri: paper.thumbnailUrl }} style={styles.thumb} contentFit="cover" transition={150} />
        ) : (
          <Text style={[typeScale.tiny, { color: palette.muted }]}>paper</Text>
        )}
      </View>

      <View style={styles.body}>
        <Text style={[typeScale.title, styles.title, { color: palette.ink, fontFamily: font.display }]} numberOfLines={3}>
          {paper.title}
        </Text>
        {authorLine ? (
          <Text style={[typeScale.tiny, { color: palette.muted }]} numberOfLines={1}>
            {authorLine}
          </Text>
        ) : null}
        <View style={styles.meta}>
          <Text style={[typeScale.tiny, { color: palette.inkSoft }]}>▲ {formatCount(paper.upvotes ?? 0)}</Text>
          <Text style={[typeScale.tiny, { color: palette.muted }]}>{paper.id}</Text>
          <Text style={[typeScale.tiny, styles.date, { color: palette.muted }]}>
            {timeAgo(paper.publishedAt ?? paper.submittedOnDailyAt)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export const paperListStyles = ui.screenPadding;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.md },
  thumbWrap: {
    width: 84,
    height: 62,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumb: { width: '100%', height: '100%' },
  body: { flex: 1, gap: 4 },
  title: { fontSize: 16, lineHeight: 21 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2 },
  date: { marginLeft: 'auto' },
});
