/**
 * styles/tokens/spacing.ts — RayZar Design Token System
 *
 * Base unit: 4px (0.25rem)
 * Maps directly to Tailwind spacing scale.
 * Semantic tokens name common layout patterns.
 */

export const spacing = {
  // ── Base scale (multiples of 4px) ─────────────────────────────────────────
  0:   '0',
  0.5: '0.125rem',  //  2px
  1:   '0.25rem',   //  4px
  1.5: '0.375rem',  //  6px
  2:   '0.5rem',    //  8px
  2.5: '0.625rem',  // 10px
  3:   '0.75rem',   // 12px
  3.5: '0.875rem',  // 14px
  4:   '1rem',      // 16px
  5:   '1.25rem',   // 20px
  6:   '1.5rem',    // 24px
  7:   '1.75rem',   // 28px
  8:   '2rem',      // 32px
  10:  '2.5rem',    // 40px
  12:  '3rem',      // 48px
  16:  '4rem',      // 64px
  20:  '5rem',      // 80px
  24:  '6rem',      // 96px

  // ── Semantic spacing ───────────────────────────────────────────────────────
  cardPadding:    '1.5rem',   // p-6: padding inside cards
  sectionGap:     '1.5rem',   // gap-6: space between sections
  pageMargin:     '1rem',     // px-4: page horizontal padding
  componentGap:   '1rem',     // gap-4: space between components
  inlineGap:      '0.5rem',   // gap-2: inline element spacing
  chartPadding:   '0.75rem',  // p-3: chart toolbar padding
  tooltipPadding: '0.5rem',   // p-2: tooltip inner padding
  badgePaddingX:  '0.5rem',   // px-2: badge horizontal padding
  badgePaddingY:  '0.125rem', // py-0.5: badge vertical padding
} as const;
