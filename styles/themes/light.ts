/**
 * styles/themes/light.ts — RayZar Light Theme
 *
 * ⚠️  RESERVED FOR UX DESIGNER — DO NOT FILL MANUALLY
 *
 * When the UX designer joins, they will:
 * 1. Define all --color-* variable values below
 * 2. Add :root[data-theme="light"] { ... } block to app/globals.css
 * 3. The entire application will update instantly — no component code changes
 *
 * This file documents the intended structure for the light theme.
 */

export const lightTheme = {
  id: 'light' as const,
  name: 'Light',
  description: 'Light background — reserved for UX designer',
  isDefault: false,
  isReady: false, // set to true when UX designer completes the theme

  // ── UX Designer fills this section ────────────────────────────────────────
  // palette: {
  //   bg:       '#FFFFFF',
  //   panel:    '#F6F8FA',
  //   card:     '#FFFFFF',
  //   elevated: '#EAEEF2',
  //
  //   textPrimary:   '#1C2128',
  //   textSecondary: '#57606A',
  //   textMuted:     '#8C959F',
  //   textDisabled:  '#CFD5DC',
  //
  //   teal:     '#00B894',   // adjusted for light bg
  //   amber:    '#D97706',
  //
  //   bull:        '#16A34A',
  //   strongBull:  '#166534',
  //   bear:        '#DC2626',
  //   strongBear:  '#991B1B',
  //   neutral:     '#6B7280',
  //
  //   border:       '#D0D7DE',
  //   borderSubtle: '#EAEEF2',
  //   borderFocus:  '#0969DA',
  // },
} as const;
