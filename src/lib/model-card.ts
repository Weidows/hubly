/**
 * Model cards are not clean markdown: they start with YAML frontmatter and are full of raw HTML
 * (`<div align="center">`, `<img>`, `<a>`, `<details>`, HTML tables). React Native cannot render
 * HTML, so the card is normalised into markdown the renderer understands.
 *
 * What it does, in order:
 *  1. drops the leading `---` YAML block (the HF website hides it too)
 *  2. removes HTML comments
 *  3. rewrites `<img src>` to markdown images — this is what shows the banner art
 *  4. rewrites `<a href>text</a>` to markdown links
 *  5. rewrites `<br>` and `<summary>` into markdown equivalents
 *  6. strips every remaining tag, keeping the inner text (HTML tables lose their grid but keep
 *     their cells — a deliberate trade-off, RN has no table renderer)
 *
 * Anything still unrenderable (LaTeX math) is left as source text on purpose.
 */
export function normalizeRepoCard(markdown: string): string {
  let md = markdown;

  md = md.replace(/^\uFEFF?\s*---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
  md = md.replace(/<!--[\s\S]*?-->/g, '');
  md = md.replace(/<img[^>]*?src=["']([^"']+)["'][^>]*>/gi, (_m, src: string) => `\n\n![](${src})\n\n`);
  md = md.replace(
    /<a[^>]*?href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
    (_m, href: string, text: string) => `[${stripTags(text).trim()}](${href})`,
  );
  md = md.replace(/<br\s*\/?>/gi, '\n');
  md = md.replace(/<summary>([\s\S]*?)<\/summary>/gi, (_m, s: string) => `**${stripTags(s).trim()}**\n\n`);

  // Block-level tags become line breaks so paragraphs do not glue together; inline tags vanish.
  md = md.replace(
    /<\/?(?:div|p|span|center|table|thead|tbody|tr|td|th|ul|ol|li|dl|dt|dd|h[1-6]|details|blockquote|sup|sub|font|strong|em|b|i|code|pre|video|source|iframe|section|figure|figcaption|hr|picture|small|kbd|u|s)\b[^>]*>/gi,
    '\n',
  );
  md = md.replace(/[ \t]+\n/g, '\n');
  md = md.replace(/\n{3,}/g, '\n\n');
  return md.trim();
}

function stripTags(value: string) {
  return value.replace(/<[^>]*>/g, '');
}
