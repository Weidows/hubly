import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { RepoSummary, RepoType } from '@/api/types';
import { Chip, Stat } from '@/components/ui';
import { formatCount, prettyTask, timeAgo } from '@/lib/format';
import { font, radius, shadow, spacing, type as typeScale, useTheme } from '@/theme';

/**
 * Feed card for a model / dataset / Space.
 * The list API only returns a description for datasets, so the card is built around what is
 * always there: owner, name, task, downloads, likes, freshness.
 */
export function RepoCard({
  repo,
  type,
  onPress,
}: {
  repo: RepoSummary;
  type: RepoType;
  onPress: () => void;
}) {
  const { palette } = useTheme();
  const [owner, name] = splitRepoId(repo.id);
  const task = repo.pipeline_tag ?? repo.cardData?.pipeline_tag ?? repo.sdk;
  const trending = (repo.trendingScore ?? 0) > 0 && (repo.trendingScore ?? 0) >= 20;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        shadow.card,
        {
          backgroundColor: palette.surface,
          borderColor: palette.line,
          opacity: pressed ? 0.92 : 1,
        },
      ]}>
      {trending ? (
        <View style={[styles.ribbon, { backgroundColor: palette.accent }]}>
          <Text style={[typeScale.tiny, styles.ribbonText, { color: palette.accentInk }]}>
            TRENDING
          </Text>
        </View>
      ) : null}

      <View style={styles.head}>
        <View style={styles.titleWrap}>
          <Text style={[typeScale.title, { color: palette.ink, fontFamily: font.display }]} numberOfLines={1}>
            {name}
          </Text>
          {owner ? (
            <Text style={[typeScale.small, { color: palette.muted }]} numberOfLines={1}>
              · {owner}
            </Text>
          ) : null}
        </View>
        {trending ? (
          <View style={[styles.ribbon, { backgroundColor: palette.accent }]}>
            <Text style={[typeScale.tiny, styles.ribbonText, { color: palette.accentInk }]}>
              TRENDING
            </Text>
          </View>
        ) : null}
      </View>

      {repo.description ? (
        <Text style={[typeScale.small, styles.description, { color: palette.inkSoft }]} numberOfLines={2}>
          {stripMarkup(repo.description)}
        </Text>
      ) : null}

      <View style={styles.foot}>
        {task ? <Chip label={prettyTask(task)} /> : null}
        {typeof repo.downloads === 'number' ? (
          <Stat icon="↓" value={formatCount(repo.downloads)} />
        ) : null}
        {typeof repo.likes === 'number' ? <Stat icon="♡" value={formatCount(repo.likes)} /> : null}
        <Text style={[typeScale.tiny, styles.updated, { color: palette.muted }]}>
          {timeAgo(repo.lastModified)}
        </Text>
      </View>
    </Pressable>
  );
}

export function splitRepoId(id: string): [string | undefined, string] {
  const slash = id.indexOf('/');
  if (slash === -1) return [undefined, id];
  return [id.slice(0, slash), id.slice(slash + 1)];
}

/** Dataset descriptions arrive as markdown-ish text; flatten it for a two-line preview. */
function stripMarkup(value: string) {
  return value
    .replace(/[#*_>`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  ribbon: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  ribbonText: { fontWeight: '800', letterSpacing: 0.4 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  titleWrap: { flexDirection: 'row', alignItems: 'baseline', gap: 6, flexWrap: 'wrap', flexShrink: 1 },
  description: { marginTop: -2 },
  foot: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: 2, flexWrap: 'wrap' },
  updated: { marginLeft: 'auto' },
});
