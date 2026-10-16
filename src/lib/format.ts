/** 1234567 -> "1.2M". HF numbers are big; screens have ~60px for them. */
export function formatCount(value: number | undefined | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) return '—';
  if (value < 1000) return String(value);
  if (value < 1_000_000) return `${trim(value / 1000)}k`;
  if (value < 1_000_000_000) return `${trim(value / 1_000_000)}M`;
  return `${trim(value / 1_000_000_000)}B`;
}

function trim(value: number) {
  const rounded = value >= 100 ? Math.round(value) : Math.round(value * 10) / 10;
  return String(rounded);
}

/** "3 days ago" / "2026-10-16" — compact relative time for feeds. */
export function timeAgo(iso: string | undefined | null): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const seconds = Math.max(0, (Date.now() - then) / 1000);
  const units: [number, string][] = [
    [60, 's'],
    [3600, 'm'],
    [86400, 'h'],
    [2592000, 'd'],
    [31536000, 'mo'],
  ];
  if (seconds < 60) return `${Math.round(seconds)}s`;
  for (let i = 1; i < units.length; i += 1) {
    const [limit, suffix] = units[i];
    if (seconds < limit) return `${Math.round(seconds / units[i - 1][0])}${suffix}`;
  }
  return `${Math.round(seconds / 31536000)}y`;
}

/** The pipeline tag is a long slug ("image-text-to-text"); show something readable in a chip. */
export function prettyTask(tag: string | undefined | null): string {
  if (!tag) return '';
  return tag.replace(/-/g, ' ');
}
