/**
 * styles/tokens/borders.ts — RayZar Design Token System
 *
 * Border widths and radius values.
 * Colors are in colors.ts under colors.border.
 */

export const borders = {

  // ── Border widths ─────────────────────────────────────────────────────────
  width: {
    thin:   '1px',
    medium: '2px',
    thick:  '3px',
  },

  // ── Border radius ─────────────────────────────────────────────────────────
  radius: {
    none:  '0',
    sm:    '0.25rem',  //  4px — small elements, labels
    md:    '0.375rem', //  6px — buttons
    lg:    '0.5rem',   //  8px — cards, panels
    xl:    '0.75rem',  // 12px — large cards
    '2xl': '1rem',     // 16px — modals
    full:  '9999px',   // pill — badges, tags
    // Semantic
    badge:  '0.25rem',  // rounded badge
    pill:   '9999px',   // pill badge
    card:   '0.5rem',   // card corners
    panel:  '0.5rem',   // panel corners
    button: '0.375rem', // button corners
    input:  '0.375rem', // input corners
    modal:  '0.75rem',  // modal corners
    chart:  '0.5rem',   // chart container corners
  },
} as const;
