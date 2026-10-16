import Markdown from '@ronradtke/react-native-markdown-display';
import { useMemo } from 'react';
import { Linking, StyleSheet, View, type ViewStyle } from 'react-native';

import { softWrapLongTokens } from '@/lib/soft-wrap';
import { font, spacing, type as typeScale, useTheme } from '@/theme';

/**
 * Model cards are long markdown documents. Two honest limitations:
 * - LaTeX math is not rendered (no KaTeX without a WebView) — it shows as source text.
 * - Relative links and images inside a card resolve against huggingface.co.
 */
export function MarkdownBlock({ children }: { children: string }) {
  const { palette } = useTheme();
  const wrapped = useMemo(() => softWrapLongTokens(children), [children]);

  const rules = useMemo(() => {
    const base = typeScale.body;
    return {
      body: { color: palette.inkSoft, ...base },
      heading1: { color: palette.ink, fontSize: 22, lineHeight: 28, marginTop: spacing.lg, fontFamily: font.display },
      heading2: { color: palette.ink, fontSize: 18, lineHeight: 24, marginTop: spacing.lg, fontFamily: font.display },
      heading3: { color: palette.ink, fontSize: 16, lineHeight: 22, marginTop: spacing.md },
      link: { color: palette.hot },
      code_inline: {
        backgroundColor: palette.surfaceAlt,
        color: palette.ink,
        fontFamily: font.mono,
        fontSize: 12.5,
      },
      code_block: {
        backgroundColor: palette.surfaceAlt,
        color: palette.ink,
        borderColor: palette.line,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 8,
        padding: spacing.md,
        fontFamily: font.mono,
        fontSize: 12.5,
      },
      fence: {
        backgroundColor: palette.surfaceAlt,
        color: palette.ink,
        borderColor: palette.line,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 8,
        padding: spacing.md,
        fontFamily: font.mono,
        fontSize: 12.5,
      },
      blockquote: {
        backgroundColor: palette.surfaceAlt,
        borderLeftColor: palette.accent,
        borderLeftWidth: 3,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
      },
      table: { borderColor: palette.line, borderWidth: StyleSheet.hairlineWidth, borderRadius: 8 },
      hr: { backgroundColor: palette.line, height: StyleSheet.hairlineWidth },
      image: { borderRadius: 8 } as ViewStyle,
    };
  }, [palette]);

  return (
    <View style={styles.wrap}>
      <Markdown
        style={rules as never}
        onLinkPress={(url: string) => {
          void Linking.openURL(url);
          return false;
        }}
      >
        {wrapped}
      </Markdown>
    </View>
  );
}

const styles = StyleSheet.create({
  // A markdown block must never widen its parent: clip anything the renderer cannot wrap.
  wrap: { paddingBottom: spacing.xl, width: '100%', maxWidth: '100%', flexShrink: 1, overflow: 'hidden' },
});
