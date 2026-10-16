/**
 * Long unbroken tokens (URLs in model cards and comments) overflow their box on every platform:
 * React Native and react-native-web expose neither `word-break` nor `overflow-wrap`, so text
 * simply does not wrap at a 60-char URL.
 *
 * Fix: insert U+200B (zero-width space) into very long runs. It is a soft break opportunity in
 * every text layout engine, prints as nothing, and keeps the string intact otherwise.
 *
 * Two things must never be touched, or the markdown changes meaning:
 *  - fenced/inline code (` ``` `, `` ` ``) — bytes belong to the user
 *  - markdown link targets `](https://…)` — a ZWSP inside the URL breaks the link
 *    (link *labels* are safe to wrap, and are the part that overflows anyway)
 */
const ZERO_WIDTH_SPACE = '\u200B';
const DEFAULT_MAX_RUN = 24;

export function softWrapLongTokens(markdown: string, maxRun = DEFAULT_MAX_RUN): string {
  const wrapRuns = (segment: string) =>
    segment.replace(new RegExp(`\\S{${maxRun + 1},}`, 'g'), (run) =>
      run.replace(new RegExp(`(.{${maxRun}})`, 'g'), `$1${ZERO_WIDTH_SPACE}`),
    );

  // Odd indices are code (fenced blocks or inline spans) and are returned verbatim.
  return markdown
    .split(/(```[\s\S]*?```|`[^`\n]*`)/g)
    .map((part, index) => (index % 2 === 1 ? part : wrapOutsideLinkTargets(part, wrapRuns)))
    .join('');
}

function wrapOutsideLinkTargets(segment: string, wrapRuns: (s: string) => string): string {
  const out: string[] = [];
  const linkPattern = /\[([^\]\n]*)\]\(([^)\s]*)\)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = linkPattern.exec(segment)) !== null) {
    out.push(wrapRuns(segment.slice(cursor, match.index)));
    out.push(`[${wrapRuns(match[1])}](${match[2]})`);
    cursor = match.index + match[0].length;
  }
  out.push(wrapRuns(segment.slice(cursor)));
  return out.join('');
}
