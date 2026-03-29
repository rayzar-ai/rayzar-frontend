/**
 * styles/tokens/shadows.ts — RayZar Design Token System
 *
 * Maps to Tailwind shadow utilities defined in tailwind.config.ts.
 * Raw values here for use in style={{ boxShadow: ... }} props.
 */

export const shadows = {
  // ── Box shadows ───────────────────────────────────────────────────────────
  // Matches tailwind.config.ts boxShadow extensions
  tealGlow: '0 0 16px rgba(0, 212, 170, 0.25)',  // shadow-teal-glow
  tealSm:   '0 0 8px rgba(0, 212, 170, 0.15)',   // shadow-teal-sm
  card:     '0 4px 24px rgba(0, 0, 0, 0.4)',     // shadow-card
  panel:    '0 2px 12px rgba(0, 0, 0, 0.5)',     // shadow-panel

  // ── Generic elevation ─────────────────────────────────────────────────────
  sm:   '0 1px 3px rgba(0, 0, 0, 0.3)',
  md:   '0 4px 12px rgba(0, 0, 0, 0.4)',
  lg:   '0 8px 24px rgba(0, 0, 0, 0.5)',
  xl:   '0 12px 32px rgba(0, 0, 0, 0.6)',
  chart:'0 4px 16px rgba(0, 0, 0, 0.6)',

  // ── Glow helpers (for inline style) ──────────────────────────────────────
  glowTeal:   (opacity = 0.4) => `0 0 12px rgba(0,212,170,${opacity})`,
  glowBull:   (opacity = 0.4) => `0 0 8px rgba(16,185,129,${opacity})`,
  glowBear:   (opacity = 0.4) => `0 0 8px rgba(239,68,68,${opacity})`,
  glowAmber:  (opacity = 0.4) => `0 0 8px rgba(245,158,11,${opacity})`,
  glowCustom: (hex: string, opacity = 0.4) => `0 0 8px ${hex}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
} as const;
