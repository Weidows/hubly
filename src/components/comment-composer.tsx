import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { useT } from '@/i18n';
import { radius, spacing, type as typeScale, useTheme } from '@/theme';

/**
 * Markdown comment box. Posting needs a token carrying `write-discussions`, so when the user is
 * anonymous the box is replaced by a sign-in call to action instead of failing at submit time.
 */
export function CommentComposer({
  onSubmit,
  isPosting,
  error,
  replyingTo,
  onCancelReply,
  placeholder,
  submitLabel,
}: {
  onSubmit: (text: string) => void;
  isPosting?: boolean;
  error?: string | null;
  replyingTo?: string;
  onCancelReply?: () => void;
  placeholder?: string;
  submitLabel?: string;
}) {
  const t = useT();
  const { palette } = useTheme();
  const { status, signIn } = useAuth();
  const [text, setText] = useState('');

  if (status !== 'signedIn') {
    return (
      <View style={[styles.gate, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <Text style={[typeScale.small, { color: palette.inkSoft }]}>{t('discussion.signInToPost')}</Text>
        <Pressable
          onPress={() => void signIn()}
          style={({ pressed }) => [
            styles.submit,
            { backgroundColor: palette.accent, opacity: pressed ? 0.85 : 1 },
          ]}>
          <Text style={[typeScale.small, styles.submitText, { color: palette.accentInk }]}>
            {t('auth.signIn')}
          </Text>
        </Pressable>
      </View>
    );
  }

  const canSubmit = text.trim().length > 0 && !isPosting;

  return (
    <View style={[styles.wrap, { backgroundColor: palette.surface, borderColor: palette.line }]}>
      {replyingTo ? (
        <View style={styles.replyBanner}>
          <Text style={[typeScale.tiny, { color: palette.muted }]}>
            {t('discussion.replyingTo', { name: replyingTo })}
          </Text>
          <Pressable onPress={onCancelReply} hitSlop={8}>
            <Text style={[typeScale.tiny, { color: palette.danger }]}>{t('discussion.cancelReply')}</Text>
          </Pressable>
        </View>
      ) : null}

      <TextInput
        value={text}
        onChangeText={setText}
        multiline
        placeholder={placeholder ?? t('discussion.composer.placeholder')}
        placeholderTextColor={palette.muted}
        style={[
          typeScale.body,
          styles.input,
          { color: palette.ink, backgroundColor: palette.bg, borderColor: palette.line },
        ]}
        autoCapitalize="sentences"
      />

      {error ? <Text style={[typeScale.tiny, { color: palette.danger }]}>{t('discussion.postFailed')}</Text> : null}

      <Pressable
        disabled={!canSubmit}
        onPress={() => {
          const value = text.trim();
          if (!value) return;
          onSubmit(value);
          setText('');
        }}
        style={({ pressed }) => [
          styles.submit,
          {
            backgroundColor: canSubmit ? palette.accent : palette.surfaceAlt,
            opacity: pressed ? 0.85 : 1,
          },
        ]}>
        <Text
          style={[
            typeScale.small,
            styles.submitText,
            { color: canSubmit ? palette.accentInk : palette.muted },
          ]}>
          {isPosting ? '…' : (submitLabel ?? t('discussion.post'))}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  gate: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  replyBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  input: {
    minHeight: 76,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    padding: spacing.md,
    textAlignVertical: 'top',
  },
  submit: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
  },
  submitText: { fontWeight: '800' },
});
