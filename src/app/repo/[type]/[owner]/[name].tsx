import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import * as WebBrowser from 'expo-web-browser';
import { useLocalSearchParams, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { RepoType } from '@/api/types';
import { MarkdownBlock } from '@/components/markdown';
import { Chip, Divider, EmptyState, ErrorState, Loading, Segmented, Stat } from '@/components/ui';
import { useDiscussions, useRepoDetail, useRepoFiles, useRepoReadme } from '@/hooks/queries';
import { useT } from '@/i18n';
import { formatCount, prettyTask, timeAgo } from '@/lib/format';
import { normalizeRepoCard } from '@/lib/model-card';
import { font, radius, spacing, type as typeScale, useTheme } from '@/theme';

type Tab = 'card' | 'files' | 'discussions';

const markdown = (raw?: string | null) => (raw ? normalizeRepoCard(raw) : '');

/**
 * Repo detail — the reading surface: model card markdown, file list, discussions.
 * Commenting needs the OAuth token; the discussion thread view lands with the comment composer.
 */
export default function RepoDetailScreen() {
  const t = useT();
  const { palette } = useTheme();
  const params = useLocalSearchParams<{ type: string; owner: string; name: string }>();
  const type = (params.type as RepoType) ?? 'model';
  const repoId = `${params.owner}/${params.name}`;
  const [tab, setTab] = useState<Tab>('card');

  const info = useRepoDetail(type, repoId);
  const readme = useRepoReadme(type, repoId);
  const files = useRepoFiles(type, repoId);
  const discussions = useDiscussions(type, repoId);

  const webUrl = `https://huggingface.co/${type === 'model' ? '' : `${type}s/`}${repoId}`;
  const task = info.data?.pipeline_tag ?? info.data?.cardData?.pipeline_tag ?? info.data?.sdk;

  return (
    <ScrollView style={{ backgroundColor: palette.bg }} contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back}>
          <MaterialDesignIcons name="chevron-left" size={20} color={palette.ink} />
          <Text style={[typeScale.small, { color: palette.ink }]}>{t('tab.repos')}</Text>
        </Pressable>
        <Pressable onPress={() => void WebBrowser.openBrowserAsync(webUrl)} hitSlop={10}>
          <MaterialDesignIcons name="open-in-new" size={18} color={palette.muted} />
        </Pressable>
      </View>

      {info.isLoading ? <Loading label={t('common.loading')} /> : null}
      {info.error ? (
        <ErrorState
          message={(info.error as Error).message}
          onRetry={() => void info.refetch()}
          retryLabel={t('common.retry')}
        />
      ) : null}

      {info.data ? (
        <View style={styles.headerBlock}>
          <Text style={[typeScale.small, { color: palette.muted }]}>{params.owner}</Text>
          <Text style={[typeScale.display, { color: palette.ink, fontFamily: font.display }]}>
            {params.name}
          </Text>

          <View style={styles.metaRow}>
            {task ? <Chip label={prettyTask(task)} /> : null}
            {info.data.cardData?.license ? <Chip label={String(info.data.cardData.license)} /> : null}
            {info.data.gated ? <Chip label="gated" /> : null}
          </View>

          <View style={styles.statsRow}>
            <Stat icon="↓" value={formatCount(info.data.downloads)} label={t('common.downloads')} />
            <Stat icon="♡" value={formatCount(info.data.likes)} label={t('common.likes')} />
            <Stat icon="⟳" value={timeAgo(info.data.lastModified)} label={t('common.updated')} />
          </View>
        </View>
      ) : null}

      <Segmented<Tab>
        value={tab}
        onChange={setTab}
        options={[
          { value: 'card', label: t('repo.card') },
          { value: 'files', label: t('repo.files') },
          { value: 'discussions', label: t('repo.discussions') },
        ]}
      />

      <Divider />

      {tab === 'card' ? (
        readme.isLoading ? (
          <Loading label={t('common.loading')} />
        ) : readme.data ? (
          <MarkdownBlock>{markdown(readme.data)}</MarkdownBlock>
        ) : (
          <EmptyState title={t('common.empty')} />
        )
      ) : null}

      {tab === 'files' ? (
        files.isLoading ? (
          <Loading label={t('common.loading')} />
        ) : (
          <View style={styles.fileList}>
            {(files.data ?? []).map((file) => (
              <View key={file.path} style={[styles.fileRow, { borderColor: palette.line }]}>
                <MaterialDesignIcons
                  name={file.type === 'directory' ? 'folder-outline' : 'file-document-outline'}
                  size={15}
                  color={palette.muted}
                />
                <Text
                  style={[typeScale.small, styles.fileName, { color: palette.inkSoft, fontFamily: font.mono }]}
                  numberOfLines={1}>
                  {file.path}
                </Text>
                <Text style={[typeScale.tiny, { color: palette.muted }]}>
                  {file.lfs?.size ? `${formatBytes(file.lfs.size)}·lfs` : formatBytes(file.size)}
                </Text>
              </View>
            ))}
          </View>
        )
      ) : null}

      {tab === 'discussions' ? (
        discussions.isLoading ? (
          <Loading label={t('common.loading')} />
        ) : (discussions.data ?? []).length === 0 ? (
          <EmptyState title={t('discussion.empty')} />
        ) : (
          <View style={styles.discussionList}>
            {(discussions.data ?? []).map((discussion) => (
              <Pressable
                key={discussion.num}
                onPress={() => void WebBrowser.openBrowserAsync(`${webUrl}/discussions/${discussion.num}`)}
                style={({ pressed }) => [
                  styles.discussionRow,
                  { borderColor: palette.line, opacity: pressed ? 0.8 : 1 },
                ]}>
                <View style={styles.discussionHead}>
                  <Chip
                    label={
                      discussion.status === 'open'
                        ? t('discussion.open')
                        : discussion.status === 'merged'
                          ? t('discussion.merged')
                          : t('discussion.closed')
                    }
                  />
                  {discussion.pinned ? <Chip label="pinned" tone="outline" /> : null}
                  <Text style={[typeScale.tiny, styles.discussionDate, { color: palette.muted }]}>
                    {timeAgo(discussion.createdAt)}
                  </Text>
                </View>
                <Text style={[typeScale.body, { color: palette.ink }]} numberOfLines={2}>
                  {discussion.title}
                </Text>
                <Text style={[typeScale.tiny, { color: palette.muted }]}>
                  @{discussion.author?.name} · {discussion.numComments} {t('common.comments')}
                </Text>
              </Pressable>
            ))}
          </View>
        )
      ) : null}
    </ScrollView>
  );
}

function formatBytes(bytes: number | undefined): string {
  if (!bytes) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value >= 10 ? Math.round(value) : value.toFixed(1)}${units[unit]}`;
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 130 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { flexDirection: 'row', alignItems: 'center' },
  headerBlock: { gap: spacing.sm, marginBottom: spacing.sm },
  metaRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  statsRow: { flexDirection: 'row', gap: spacing.xl, marginTop: spacing.xs },
  fileList: { gap: 2 },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  fileName: { flex: 1 },
  discussionList: { gap: spacing.md },
  discussionRow: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  discussionHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  discussionDate: { marginLeft: 'auto' },
});
