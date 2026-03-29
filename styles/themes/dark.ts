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
    bg:       '#080c14',
    panel:    '#0d1117',
    card:     '#111827',
    elevated: '#161b22',

    textPrimary:   '#e6edf3',
    textSecondary: '#8b949e',
    textMuted:     '#484f58',
    textDisabled:  '#30363d',

    teal:     '#00d4aa',
    amber:    '#f59e0b',

    bull:        '#10b981',
    strongBull:  '#059669',
    bear:        '#ef4444',
    strongBear:  '#dc2626',
    neutral:     '#6b7280',

    border:       '#1e2433',
    borderSubtle: '#161b22',
    borderFocus:  '#00d4aa',
  },
} as const;
