/**
 * styles/tokens/animations.ts — RayZar Design Token System
 *
 * Animation class names (maps to globals.css keyframes + tailwind.config.ts).
 * Durations and easings for inline style transitions.
 */

export const animations = {

  // ── Utility class names (from globals.css) ────────────────────────────────
  fadeIn:     'animate-fade-in',       // 0.3s ease
  slideRight: 'animate-slide-right',   // 0.25s ease
  pulseGlow:  'animate-pulse-glow',    // 2s ease-in-out infinite

  // ── Tailwind animation classes (from tailwind.config.ts) ──────────────────
  tickerScroll: 'animate-ticker-scroll',

  // ── Transition durations ───────────────────────────────────────────────────
  duration: {
    fast:   '100ms',
    normal: '150ms',
    slow:   '200ms',
    theme:  '200ms', // theme switch transition
    bar:    '700ms', // bar fill animation (health score, confidence)
  },

  // ── Easing functions ──────────────────────────────────────────────────────
  easing: {
    default: 'ease',
    in:      'ease-in',
    out:     'ease-out',
    inOut:   'ease-in-out',
  },

  // ── Common transition strings (for style={{ transition: ... }}) ───────────
  transition: {
    colors:   'color 150ms ease, background-color 150ms ease, border-color 150ms ease',
    opacity:  'opacity 150ms ease',
    all:      'all 150ms ease',
    shadow:   'box-shadow 150ms ease',
    bar:      'width 700ms ease-out',
    needle:   'left 700ms ease-out',
  },
} as const;
