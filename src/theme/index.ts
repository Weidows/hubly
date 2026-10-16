/** Theme access: `const t = useTheme(); t.palette.ink` */
import { useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { palettes, type Palette, type ThemeName } from './tokens';

export type Theme = { name: ThemeName; dark: boolean; palette: Palette };

export function useTheme(): Theme {
  const scheme = useColorScheme();
  const name: ThemeName = scheme === 'dark' ? 'dark' : 'light';
  return useMemo(() => ({ name, dark: name === 'dark', palette: palettes[name] }), [name]);
}

export * from './tokens';
