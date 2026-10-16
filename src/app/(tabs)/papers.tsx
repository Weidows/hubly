import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Segmented, ErrorState, Loading, ui } from '@/components/ui';
import { PaperRow } from '@/components/paper-row';
import type { Paper } from '@/api/types';
import { useDailyPapers, usePaperFeed } from '@/hooks/queries';
import { useT } from '@/i18n';
import { useState } from 'react';
import * as WebBrowser from 'expo-web-browser';

import { spacing, type as typeScale, useTheme } from '@/theme';

type Mode = 'daily' | 'trending';

/**
 * Papers tab. A paper detail screen with in-app comments is on the roadmap; until it exists,
 * tapping a row opens the paper page on huggingface.co.
 */
export default function PapersScreen() {
  const t = useT();
  const { palette } = useTheme();
  const [mode, setMode] = useState<Mode>('daily');

  const daily = useDailyPapers();
  const trending = usePaperFeed(mode === 'trending' ? 'trending' : 'daily');

  // Both feeds are typed, but a malformed response must not take the whole screen down.
  const dailyList = Array.isArray(daily.data) ? daily.data : [];
  const trendingList = trending.data?.pages.flatMap((p) => (Array.isArray(p.items) ? p.items : [])) ?? [];
  // The daily feed carries the thumbnail on the wrapper, not inside `paper`.
  const items: Paper[] =
    mode === 'daily'
      ? dailyList.map((entry) => ({
          ...entry.paper,
          thumbnailUrl: entry.paper.thumbnailUrl ?? entry.thumbnail,
        }))
      : trendingList;
  const isLoading = mode === 'daily' ? daily.isLoading : trending.isLoading;
  const error = mode === 'daily' ? daily.error : trending.error;
  const refetch = mode === 'daily' ? daily.refetch : trending.refetch;
  const isRefetching = mode === 'daily' ? daily.isRefetching : trending.isRefetching;

  return (
    <View style={[styles.screen, { backgroundColor: palette.bg }]}>
      <View style={styles.header}>
        <Text style={[typeScale.display, { color: palette.ink, fontWeight: '800' }]}>
          {t('tab.papers')}
        </Text>
        <Segmented<Mode>
          value={mode}
          onChange={setMode}
          options={[
            { value: 'daily', label: t('papers.daily') },
            { value: 'trending', label: t('papers.trending') },
          ]}
        />
      </View>

      {isLoading ? <Loading label={t('common.loading')} /> : null}
      {error ? (
        <ErrorState message={(error as Error).message} onRetry={refetch} retryLabel={t('common.retry')} />
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PaperRow
            paper={item}
            onPress={() => WebBrowser.openBrowserAsync(`https://huggingface.co/papers/${item.id}`)}
          />
        )}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: palette.line }]} />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor={palette.muted}
          />
        }
        onEndReachedThreshold={0.6}
        onEndReached={() => {
          if (mode === 'trending' && trending.hasNextPage && !trending.isFetchingNextPage) {
            void trending.fetchNextPage();
          }
        }}
        ListEmptyComponent={
          !isLoading && !error ? (
            <Text style={[typeScale.small, styles.empty, { color: palette.muted }]}>
              {t('common.empty')}
            </Text>
          ) : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md, gap: spacing.md },
  list: { ...ui.screenPadding, paddingBottom: 120 },
  separator: { height: StyleSheet.hairlineWidth },
  empty: { textAlign: 'center', paddingVertical: 40 },
});
