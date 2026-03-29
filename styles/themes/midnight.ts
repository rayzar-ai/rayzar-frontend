/**
 * styles/themes/midnight.ts — RayZar Midnight Theme
 *
 * ⚠️  RESERVED FOR UX DESIGNER — DO NOT FILL MANUALLY
 *
 * Deep dark variant — maximum contrast, true blacks.
 * When ready, UX designer adds :root[data-theme="midnight"] to globals.css.
 */

export const midnightTheme = {
  id: 'midnight' as const,
  name: 'Midnight',
  description: 'Deep dark — maximum contrast',
  isDefault: false,
  isReady: false,

  // ── UX Designer fills this section ────────────────────────────────────────
  // palette: {
  //   bg:       '#000000',
  //   panel:    '#0A0A0A',
  //   card:     '#111111',
  //   elevated: '#1A1A1A',
  //   // signals and accents may stay same as dark theme
  //   // or be tuned for maximum contrast
  // },
} as const;
