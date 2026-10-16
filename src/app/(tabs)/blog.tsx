import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

import type { BlogPost } from '@/api/types';
import { ErrorState, Loading, Segmented } from '@/components/ui';
import { useBlogFeed } from '@/hooks/queries';
import { useT } from '@/i18n';
import { formatCount, timeAgo } from '@/lib/format';
import { font, radius, spacing, type as typeScale, useTheme } from '@/theme';

type Lang = 'global' | 'zh';

export default function BlogScreen() {
  const t = useT();
  const { palette } = useTheme();
  const [lang, setLang] = useState<Lang>('global');
  const feed = useBlogFeed(lang);
  const items = feed.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <View style={[styles.screen, { backgroundColor: palette.bg }]}>
      <View style={styles.header}>
        <Text style={[typeScale.display, { color: palette.ink, fontWeight: '800' }]}>{t('tab.blog')}</Text>
        <Segmented<Lang>
          value={lang}
          onChange={setLang}
          options={[
            { value: 'global', label: 'Global' },
            { value: 'zh', label: '中文' },
          ]}
        />
      </View>

      {feed.isLoading ? <Loading label={t('common.loading')} /> : null}
      {feed.error ? (
        <ErrorState
          message={(feed.error as Error).message}
          onRetry={() => void feed.refetch()}
          retryLabel={t('common.retry')}
        />
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(item) => item.slug}
        renderItem={({ item }) => (
          <BlogRow
            post={item}
            onPress={() =>
              WebBrowser.openBrowserAsync(`https://huggingface.co/blog/${item.slug}`)
            }
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={feed.isRefetching} onRefresh={() => void feed.refetch()} tintColor={palette.muted} />
        }
        onEndReachedThreshold={0.6}
        onEndReached={() => {
          if (feed.hasNextPage && !feed.isFetchingNextPage) void feed.fetchNextPage();
        }}
        ListEmptyComponent={
          !feed.isLoading && !feed.error ? (
            <Text style={[typeScale.small, styles.empty, { color: palette.muted }]}>
              {t('common.empty')}
            </Text>
          ) : undefined
        }
      />
    </View>
  );
}

function BlogRow({ post, onPress }: { post: BlogPost; onPress: () => void }) {
  const { palette } = useTheme();
  const author = post.author?.fullname ?? post.author?.name;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: palette.surface, borderColor: palette.line, opacity: pressed ? 0.9 : 1 },
      ]}>
      <Text style={[typeScale.title, styles.title, { color: palette.ink, fontFamily: font.display }]} numberOfLines={3}>
        {post.title}
      </Text>
      <View style={styles.meta}>
        {author ? <Text style={[typeScale.tiny, { color: palette.muted }]}>{author}</Text> : null}
        {post.numCoauthors && post.numCoauthors > 1 ? (
          <Text style={[typeScale.tiny, { color: palette.muted }]}>
            +{post.numCoauthors - 1}
          </Text>
        ) : null}
        <Text style={[typeScale.tiny, { color: palette.inkSoft }]}>▲ {formatCount(post.upvotes ?? 0)}</Text>
        <Text style={[typeScale.tiny, styles.date, { color: palette.muted }]}>
          {timeAgo(post.publishedAt ?? post.editedAt)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md, gap: spacing.md },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 120, gap: spacing.md },
  title: { letterSpacing: -0.3 },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap' },
  date: { marginLeft: 'auto' },
  empty: { textAlign: 'center', paddingVertical: 40 },
});
