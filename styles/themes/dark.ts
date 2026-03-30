/**
 * styles/themes/dark.ts — RayZar Dark Theme
 *
 * This is the ACTIVE default theme.
 * All values are already set in app/globals.css under :root
 * No CSS overrides needed — dark is the baseline.
 *
 * This file documents the dark theme values for reference.
 * UX designer updates app/globals.css :root to change dark theme.
 */

export const darkTheme = {
  id: 'dark' as const,
  name: 'Dark',
  description: 'Deep dark — default RayZar theme',
  isDefault: true,

  // Documented values (actual source: app/globals.css :root)
  palette: {
    bg:       '#0b1426',
    panel:    '#0f1b33',
    card:     '#132040',
    elevated: '#1a2b4a',

    textPrimary:   '#e8edf5',
    textSecondary: '#8ba3c7',
    textMuted:     '#4d6490',
    textDisabled:  '#2d4470',

    teal:     '#4a9eff',
    amber:    '#f59e0b',

    bull:        '#00c087',
    strongBull:  '#00a073',
    bear:        '#ff4b4b',
    strongBear:  '#e53935',
    neutral:     '#8ba3c7',

    border:       '#1e3059',
    borderSubtle: '#132040',
    borderFocus:  '#4a9eff',
  },
} as const;
