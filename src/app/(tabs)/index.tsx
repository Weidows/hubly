import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Keyboard,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RepoType } from '@/api/types';
import { RepoCard } from '@/components/repo-card';
import { EmptyState, ErrorState, Loading, Segmented } from '@/components/ui';
import { useRepoFeed } from '@/hooks/queries';
import { useT } from '@/i18n';
import { radius, spacing, type as typeScale, shadow, useTheme } from '@/theme';

export default function ReposScreen() {
  const t = useT();
  const { palette } = useTheme();
  const [type, setType] = useState<RepoType>('model');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const feed = useRepoFeed(type, query);

  const repos = useMemo(
    () => feed.data?.pages.flatMap((page) => page.items) ?? [],
    [feed.data],
  );

  const submit = () => {
    Keyboard.dismiss();
    setQuery(search.trim());
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: palette.bg }]} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={[styles.mark, shadow.card, { backgroundColor: palette.accent }]}>
            <Text style={[styles.markText, { color: palette.accentInk }]}>H</Text>
          </View>
          <Text style={[typeScale.display, { color: palette.ink, fontWeight: '800' }]}>
            Hub<Text style={{ backgroundColor: palette.accent, color: palette.accentInk }}>ly</Text>
          </Text>
        </View>

        <View
          style={[
            styles.search,
            shadow.card,
            { backgroundColor: palette.surface, borderColor: palette.line },
          ]}>
          <Text style={[typeScale.small, { color: palette.muted }]}>⌕</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={submit}
            returnKeyType="search"
            placeholder={t('repos.search.placeholder')}
            placeholderTextColor={palette.muted}
            style={[typeScale.small, styles.searchInput, { color: palette.ink }]}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {search ? (
            <Pressable
              hitSlop={8}
              onPress={() => {
                setSearch('');
                setQuery('');
              }}>
              <Text style={[typeScale.small, { color: palette.muted }]}>✕</Text>
            </Pressable>
          ) : null}
        </View>

        <Segmented<RepoType>
          value={type}
          onChange={setType}
          options={[
            { value: 'model', label: t('repos.models') },
            { value: 'dataset', label: t('repos.datasets') },
            { value: 'space', label: t('repos.spaces') },
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
        data={repos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RepoCard
            repo={item}
            type={type}
            onPress={() => {
              const [owner, name] = item.id.includes('/')
                ? [item.id.slice(0, item.id.indexOf('/')), item.id.slice(item.id.indexOf('/') + 1)]
                : ['', item.id];
              router.push({ pathname: '/repo/[type]/[owner]/[name]', params: { type, owner, name } });
            }}
          />
        )}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        refreshControl={
          <RefreshControl
            refreshing={feed.isRefetching}
            onRefresh={() => void feed.refetch()}
            tintColor={palette.muted}
          />
        }
        onEndReachedThreshold={0.6}
        onEndReached={() => {
          if (feed.hasNextPage && !feed.isFetchingNextPage) void feed.fetchNextPage();
        }}
        ListEmptyComponent={
          !feed.isLoading && !feed.error ? (
            <EmptyState title={t('common.empty')} detail={query ? `“${query}”` : undefined} />
          ) : undefined
        }
        ListFooterComponent={
          feed.isFetchingNextPage ? (
            <Text style={[typeScale.tiny, styles.footer, { color: palette.muted }]}>
              {t('common.loading')}
            </Text>
          ) : undefined
        }
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.md },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  mark: {
    width: 30,
    height: 30,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-6deg' }],
  },
  markText: { fontSize: 15, fontWeight: '800' },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  searchInput: { flex: 1, paddingVertical: 0 },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 130 },
  footer: { textAlign: 'center', paddingVertical: spacing.lg },
});
