/**
 * Design tokens — the "Warm Hub" direction (variant 3) with the reading typography from
 * variant 1 applied to title text. Light is the primary theme; dark follows the system.
 *
 * Every colour used by a screen must come from here, so switching direction later is a
 * one-file change.
 */
import { Platform } from 'react-native';

export type ThemeName = 'light' | 'dark';

export type Palette = {
  bg: string;
  surface: string;
  surfaceAlt: string;
  line: string;
  ink: string;
  inkSoft: string;
  muted: string;
  accent: string;
  accentInk: string;
  accentSoft: string;
  danger: string;
  hot: string;
};

const light: Palette = {
  bg: '#FFFCF3',
  surface: '#FFFFFF',
  surfaceAlt: '#F6F1E2',
  line: '#F0E7CF',
  ink: '#121212',
  inkSoft: '#3B372C',
  muted: '#7A7466',
  accent: '#FFC400',
  accentInk: '#121212',
  accentSoft: '#FFF3CC',
  danger: '#FF5A36',
  hot: '#FF8A00',
};

const dark: Palette = {
  bg: '#14120C',
  surface: '#1D1A13',
  surfaceAlt: '#262217',
  line: '#332D1E',
  ink: '#F6F1E2',
  inkSoft: '#D9D2BF',
  muted: '#9A9280',
  accent: '#FFC400',
  accentInk: '#14120C',
  accentSoft: '#3A301A',
  danger: '#FF6B4A',
  hot: '#FFA53D',
};

export const palettes: Record<ThemeName, Palette> = { light, dark };

export const radius = { sm: 8, md: 12, lg: 18, pill: 999 };

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 22, xxl: 30 };

/**
 * Serif display face for repo/paper titles — the reading half of the hybrid direction.
 * Family names differ per platform; there is no webfont to download and no font to bundle.
 */
export const font = {
  display: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    web: 'Georgia, "Times New Roman", serif',
    default: 'serif',
  }) as string,
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    web: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    default: 'monospace',
  }) as string,
};

export const type = {
  display: { fontSize: 26, lineHeight: 31, fontWeight: '700' as const, letterSpacing: -0.4 },
  title: { fontSize: 19, lineHeight: 25, fontWeight: '700' as const, letterSpacing: -0.3 },
  body: { fontSize: 14.5, lineHeight: 22 },
  small: { fontSize: 12.5, lineHeight: 18 },
  tiny: { fontSize: 11, lineHeight: 15 },
};

export const shadow = {
  card: {
    shadowColor: '#8C6E00',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
};
