/**
 * styles/tokens/typography.ts — RayZar Design Token System
 *
 * Font families, sizes, weights, line-heights, letter-spacing.
 * To change fonts app-wide: update these values here.
 * The UX designer will update this file — no component code changes needed.
 */

export const typography = {

  // ── Font families ─────────────────────────────────────────────────────────
  fontFamily: {
    sans:    "'Inter', system-ui, -apple-system, sans-serif",
    mono:    "'JetBrains Mono', 'Fira Code', monospace",
    heading: "'Inter', system-ui, -apple-system, sans-serif",
    chart:   "'Inter', system-ui, -apple-system, sans-serif",
    // UX designer: replace with brand fonts above
  },

  // ── Font sizes ────────────────────────────────────────────────────────────
  // Maps to Tailwind classes: text-xs, text-sm, text-base, text-lg, etc.
  // Custom sizes: text-2xs (defined in tailwind.config.ts)
  fontSize: {
    '2xs': '0.625rem',   // 10px — badges, micro labels
    xs:    '0.75rem',    // 12px — secondary labels
    sm:    '0.8125rem',  // 13px — table text, buttons
    base:  '0.875rem',   // 14px — body text
    md:    '1rem',       // 16px — primary text
    lg:    '1.125rem',   // 18px — subheadings
    xl:    '1.25rem',    // 20px — headings
    '2xl': '1.5rem',     // 24px — section titles, prices
    '3xl': '1.875rem',   // 30px — page titles
    '4xl': '2.25rem',    // 36px — hero numbers
    // Semantic sizes
    price:      '1.5rem',    // stock price display
    score:      '1.5rem',    // rayzar score display
    ticker:     '0.75rem',   // ticker symbol in tables
    label:      '0.625rem',  // chart axis labels
  },

  // ── Font weights ──────────────────────────────────────────────────────────
  // Maps to Tailwind: font-light, font-normal, font-medium, font-semibold, font-bold
  fontWeight: {
    light:     '300',
    regular:   '400',
    medium:    '500',
    semibold:  '600',
    bold:      '700',
    extrabold: '800',
  },

  // ── Line heights ──────────────────────────────────────────────────────────
  lineHeight: {
    tight:   '1.2',    // headings
    snug:    '1.375',  // subheadings
    normal:  '1.5',    // body (browser default)
    relaxed: '1.625',  // readable paragraphs
  },

  // ── Letter spacing ────────────────────────────────────────────────────────
  letterSpacing: {
    tight:     '-0.025em', // tight headings
    normal:    '0em',
    wide:      '0.025em',
    uppercase: '0.08em',   // uppercase labels, table headers
  },
} as const;
