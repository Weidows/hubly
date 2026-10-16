import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import type { RepoType } from '@/api/types';
import { useAuth } from '@/auth/auth-context';
import { Loading } from '@/components/ui';
import { useCollections } from '@/hooks/queries';
import { useCreateCollection, useSaveToCollection } from '@/hooks/mutations';
import { useT } from '@/i18n';
import { radius, shadow, spacing, type as typeScale, useTheme } from '@/theme';

/**
 * Bottom sheet for saving a repo into one of the user's HF collections.
 * Collections live on huggingface.co (nothing is stored locally), so this needs a token with the
 * `write-collections` scope — anonymous users get the sign-in call to action instead.
 */
export function SaveToCollection({
  visible,
  onClose,
  repoType,
  repoId,
}: {
  visible: boolean;
  onClose: () => void;
  repoType: RepoType;
  repoId: string;
}) {
  const t = useT();
  const { palette } = useTheme();
  const { status, user, signIn } = useAuth();
  const collections = useCollections(user?.name);
  const save = useSaveToCollection();
  const create = useCreateCollection();
  const [name, setName] = useState('');
  const [savedTo, setSavedTo] = useState<string | null>(null);

  const item = { type: repoType, id: repoId } as const;

  const runSave = (namespace: string, slug: string, title: string) =>
    save.mutate(
      { namespace, slug, item },
      {
        onSuccess: () => {
          setSavedTo(title);
          setTimeout(() => {
            setSavedTo(null);
            onClose();
          }, 900);
        },
      },
    );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, shadow.card, { backgroundColor: palette.surface, borderColor: palette.line }]}
          onPress={() => {}}>
          <Text style={[typeScale.title, { color: palette.ink }]}>{t('save.title')}</Text>
          <Text style={[typeScale.tiny, { color: palette.muted }]} numberOfLines={1}>
            {repoId}
          </Text>

          {savedTo ? (
            <Text style={[typeScale.small, { color: palette.hot, fontWeight: '700' }]}>
              {t('save.added')} → {savedTo}
            </Text>
          ) : null}

          {status !== 'signedIn' ? (
            <>
              <Text style={[typeScale.small, { color: palette.inkSoft }]}>{t('save.signIn')}</Text>
              <Pressable
                onPress={() => void signIn()}
                style={({ pressed }) => [
                  styles.primary,
                  { backgroundColor: palette.accent, opacity: pressed ? 0.85 : 1 },
                ]}>
                <Text style={[typeScale.small, styles.primaryText, { color: palette.accentInk }]}>
                  {t('auth.signIn')}
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              {collections.isLoading ? <Loading label={t('common.loading')} /> : null}

              <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
                {(collections.data ?? []).length === 0 && !collections.isLoading ? (
                  <Text style={[typeScale.small, { color: palette.muted }]}>{t('save.empty')}</Text>
                ) : null}
                {(collections.data ?? []).map((collection) => (
                  <Pressable
                    key={collection.slug}
                    onPress={() => runSave(collection.owner?.name ?? user?.name ?? '', collection.slug, collection.title)}
                    style={({ pressed }) => [
                      styles.row,
                      { borderColor: palette.line, opacity: pressed ? 0.7 : 1 },
                    ]}>
                    <Text style={[typeScale.small, { color: palette.ink, flex: 1 }]} numberOfLines={1}>
                      {collection.title}
                    </Text>
                    <Text style={[typeScale.tiny, { color: palette.muted }]}>
                      {collection.itemCount ?? collection.items?.length ?? 0}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <View style={[styles.createRow, { borderColor: palette.line }]}>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder={t('save.namePlaceholder')}
                  placeholderTextColor={palette.muted}
                  style={[
                    typeScale.small,
                    styles.input,
                    { color: palette.ink, backgroundColor: palette.bg, borderColor: palette.line },
                  ]}
                />
                <Pressable
                  disabled={!name.trim() || create.isPending}
                  onPress={() =>
                    create.mutate(
                      { title: name.trim(), namespace: user?.name },
                      {
                        onSuccess: (created) => {
                          setName('');
                          if (created?.slug) {
                            runSave(created.owner?.name ?? user?.name ?? '', created.slug, created.title);
                          }
                        },
                      },
                    )
                  }
                  style={({ pressed }) => [
                    styles.primary,
                    {
                      backgroundColor: name.trim() ? palette.accent : palette.surfaceAlt,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}>
                  <Text
                    style={[
                      typeScale.small,
                      styles.primaryText,
                      { color: name.trim() ? palette.accentInk : palette.muted },
                    ]}>
                    {t('save.createAndSave')}
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    gap: spacing.md,
    maxHeight: '80%',
  },
  list: { maxHeight: 260 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  createRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  input: {
    flex: 1,
    height: 40,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  primary: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { fontWeight: '800' },
});
