/**
 * styles/themes/index.ts — Theme Registry
 *
 * All available themes. When a new theme is ready, add it here and to globals.css.
 */

export { darkTheme } from './dark';
export { lightTheme } from './light';
export { midnightTheme } from './midnight';

export const themeIds = ['dark', 'light', 'midnight'] as const;
export type ThemeId = typeof themeIds[number];

export const themeRegistry = {
  dark: {
    id: 'dark' as const,
    name: 'Dark',
    description: 'Deep dark — default RayZar theme',
    isReady: true,
  },
  light: {
    id: 'light' as const,
    name: 'Light',
    description: 'Light background — reserved for UX designer',
    isReady: false,
  },
  midnight: {
    id: 'midnight' as const,
    name: 'Midnight',
    description: 'Deep dark — maximum contrast',
    isReady: false,
  },
} as const;
