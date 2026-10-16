import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { DiscussionEvent, RepoType } from '@/api/types';
import { CommentComposer } from '@/components/comment-composer';
import { MarkdownBlock } from '@/components/markdown';
import { Chip, Divider, ErrorState, Loading } from '@/components/ui';
import { useDiscussionDetail } from '@/hooks/queries';
import { usePostComment, useReactToComment, useReplyToComment } from '@/hooks/mutations';
import { useT } from '@/i18n';
import { timeAgo } from '@/lib/format';
import { normalizeRepoCard } from '@/lib/model-card';
import { font, radius, spacing, type as typeScale, useTheme } from '@/theme';

const REACTIONS = ['👍', '❤️', '🚀'];

/**
 * Discussion thread. HF returns `events` mixing comments, reactions and status changes;
 * comments carry markdown in `data.latest.raw`, which is what gets rendered here.
 */
export default function DiscussionScreen() {
  const t = useT();
  const { palette } = useTheme();
  const params = useLocalSearchParams<{ type: string; owner: string; name: string; num: string }>();
  const type = (params.type as RepoType) ?? 'model';
  const repoId = `${params.owner}/${params.name}`;
  const num = Number(params.num);

  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);

  const detail = useDiscussionDetail(type, repoId, num);
  const post = usePostComment(type, repoId, num);
  const reply = useReplyToComment(type, repoId, num);
  const react = useReactToComment(type, repoId, num);

  const comments = (detail.data?.events ?? []).filter((event) => event.type === 'comment');

  return (
    <ScrollView
      style={{ backgroundColor: palette.bg }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back}>
          <MaterialDesignIcons name="chevron-left" size={20} color={palette.ink} />
          <Text style={[typeScale.small, { color: palette.ink }]}>{t('repo.discussions')}</Text>
        </Pressable>
        {detail.data ? (
          <Chip
            label={
              detail.data.status === 'open'
                ? t('discussion.open')
                : detail.data.status === 'merged'
                  ? t('discussion.merged')
                  : t('discussion.closed')
            }
          />
        ) : null}
      </View>

      {detail.isLoading ? <Loading label={t('common.loading')} /> : null}
      {detail.error ? (
        <ErrorState
          message={(detail.error as Error).message}
          onRetry={() => void detail.refetch()}
          retryLabel={t('common.retry')}
        />
      ) : null}

      {detail.data ? (
        <View style={styles.header}>
          <Text style={[typeScale.display, { color: palette.ink, fontFamily: font.display }]}>
            {detail.data.title}
          </Text>
          <Text style={[typeScale.tiny, { color: palette.muted }]}>
            @{detail.data.author?.name} · {timeAgo(detail.data.createdAt)} · #{detail.data.num}
          </Text>
        </View>
      ) : null}

      <Divider />

      {comments.map((event) => (
        <Comment
          key={event.id}
          event={event}
          onReply={() => setReplyTo({ id: event.id, name: event.author?.name ?? '' })}
          onReact={(reaction) => react.mutate({ commentId: event.id, reaction })}
        />
      ))}

      {detail.data && comments.length === 0 && !detail.isLoading ? (
        <Text style={[typeScale.small, { color: palette.muted }]}>{t('discussion.empty')}</Text>
      ) : null}

      <View style={styles.composerSlot}>
        <CommentComposer
          isPosting={post.isPending || reply.isPending}
          error={post.error ? String(post.error) : reply.error ? String(reply.error) : null}
          replyingTo={replyTo?.name}
          onCancelReply={() => setReplyTo(null)}
          onSubmit={(text) => {
            if (replyTo) {
              reply.mutate(
                { commentId: replyTo.id, comment: text },
                { onSuccess: () => setReplyTo(null) },
              );
            } else {
              post.mutate(text);
            }
          }}
        />
      </View>
    </ScrollView>
  );
}

function Comment({
  event,
  onReply,
  onReact,
}: {
  event: DiscussionEvent;
  onReply: () => void;
  onReact: (reaction: string) => void;
}) {
  const t = useT();
  const { palette } = useTheme();
  const raw = event.data?.latest?.raw ?? '';
  const hidden = event.data?.hidden;

  return (
    <View style={[styles.comment, { borderColor: palette.line }]}>
      <View style={styles.commentHead}>
        {event.author?.avatarUrl ? (
          <Image source={{ uri: event.author.avatarUrl }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={[styles.avatar, { backgroundColor: palette.surfaceAlt }]} />
        )}
        <View style={{ flex: 1 }}>
          <Text style={[typeScale.small, { color: palette.ink, fontWeight: '700' }]} numberOfLines={1}>
            {event.author?.fullname ?? event.author?.name}
            {event.author?.isOwner ? ' · owner' : ''}
          </Text>
          <Text style={[typeScale.tiny, { color: palette.muted }]}>
            {timeAgo(event.createdAt)}
            {event.data?.edited ? ' · edited' : ''}
          </Text>
        </View>
      </View>

      {hidden ? (
        <Text style={[typeScale.small, { color: palette.muted }]}>hidden</Text>
      ) : (
        <MarkdownBlock>{normalizeRepoCard(raw)}</MarkdownBlock>
      )}

      <View style={styles.actions}>
        {REACTIONS.map((reaction) => (
          <Pressable
            key={reaction}
            onPress={() => onReact(reaction)}
            hitSlop={6}
            style={({ pressed }) => [
              styles.reaction,
              { backgroundColor: palette.surfaceAlt, opacity: pressed ? 0.7 : 1 },
            ]}>
            <Text style={typeScale.tiny}>{reaction}</Text>
          </Pressable>
        ))}
        <Pressable onPress={onReply} hitSlop={6} style={styles.replyButton}>
          <MaterialDesignIcons name="reply" size={13} color={palette.muted} />
          <Text style={[typeScale.tiny, { color: palette.muted }]}>{t('discussion.reply')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 60 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { flexDirection: 'row', alignItems: 'center' },
  header: { gap: spacing.sm, marginBottom: spacing.sm },
  comment: {
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  commentHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: { width: 30, height: 30, borderRadius: radius.pill },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  reaction: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  replyButton: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' },
  composerSlot: { marginTop: spacing.lg },
});
