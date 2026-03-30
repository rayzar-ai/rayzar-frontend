/**
 * styles/tokens/colors.ts — RayZar Design Token System
 *
 * ALL colour references go through this file.
 * To retheme the entire app, update the CSS variables in app/globals.css.
 * These tokens are CSS variable references — they update automatically with themes.
 *
 * rawColors: used only where CSS variables cannot be used (e.g. lightweight-charts JS API).
 * When changing themes, update rawColors to match the new CSS variable values.
 */

// ── CSS variable tokens (for className / style={{ color: ... }}) ────────────

export const colors = {

  // ── Backgrounds ──────────────────────────────────────────────────────────
  bg: {
    page:     'var(--color-bg)',       // darkest: app background
    panel:    'var(--color-panel)',    // sidebar, navbar
    card:     'var(--color-card)',     // content cards
    elevated: 'var(--color-elevated)', // modals, dropdowns
    overlay:  'var(--color-bg-overlay)', // modal backdrop
    chart:    'var(--color-bg-chart)', // chart background
  },

  // ── Text ─────────────────────────────────────────────────────────────────
  text: {
    primary:   'var(--color-text-primary)',
    secondary: 'var(--color-text-secondary)',
    muted:     'var(--color-text-muted)',
    disabled:  'var(--color-text-disabled)',
    inverse:   'var(--color-text-inverse)',  // text on teal/brand bg
    heading:   'var(--color-text-heading)',  // h1-h3, white
    link:      'var(--color-text-link)',
  },

  // ── Borders ───────────────────────────────────────────────────────────────
  border: {
    default: 'var(--color-border)',
    subtle:  'var(--color-border-subtle)',
    focus:   'var(--color-border-focus)',
  },

  // ── Accent ───────────────────────────────────────────────────────────────
  accent: {
    teal:     'var(--color-teal)',
    tealDim:  'var(--color-teal-dim)',
    tealGlow: 'var(--color-teal-glow)',
    amber:    'var(--color-amber)',
    amberDim: 'var(--color-amber-dim)',
  },

  // ── Signal ───────────────────────────────────────────────────────────────
  signal: {
    strongLong:     'var(--color-strong-bull)',
    long:           'var(--color-bull)',
    longDim:        'var(--color-bull-dim)',
    neutral:        'var(--color-neutral)',
    short:          'var(--color-bear)',
    shortDim:       'var(--color-bear-dim)',
    strongShort:    'var(--color-strong-bear)',
    // background tints
    strongLongBg:   'var(--color-signal-strong-long-bg)',
    longBg:         'var(--color-signal-long-bg)',
    neutralBg:      'var(--color-signal-neutral-bg)',
    shortBg:        'var(--color-signal-short-bg)',
    strongShortBg:  'var(--color-signal-strong-short-bg)',
  },

  // ── Score ─────────────────────────────────────────────────────────────────
  score: {
    excellent: 'var(--color-score-excellent)',  // ≥ 60
    good:      'var(--color-score-good)',       // ≥ 30
    moderate:  'var(--color-score-moderate)',   // ≥ 0
    weak:      'var(--color-score-weak)',       // ≥ -30
    poor:      'var(--color-score-poor)',       // < -30
    veryPoor:  'var(--color-score-very-poor)',  // very negative
    muted:     'var(--color-score-muted)',      // null / no data
  },

  // ── Status ────────────────────────────────────────────────────────────────
  status: {
    success: 'var(--color-status-success)',
    warning: 'var(--color-status-warning)',
    error:   'var(--color-status-error)',
    info:    'var(--color-status-info)',
    orange:  'var(--color-status-orange)',
  },

  // ── Regime ───────────────────────────────────────────────────────────────
  regime: {
    bull:       'var(--color-regime-bull)',
    recovering: 'var(--color-regime-recovering)',
    neutral:    'var(--color-regime-neutral)',
    bear:       'var(--color-regime-bear)',
  },

  // ── Chart (CSS vars — use rawColors.chart for JS chart APIs) ─────────────
  chart: {
    bg:          'var(--color-bg-chart)',
    up:          'var(--color-chart-up)',
    down:        'var(--color-chart-down)',
    volumeUp:    'var(--color-chart-vol-up)',
    volumeDown:  'var(--color-chart-vol-down)',
    sma20:       'var(--color-chart-sma20)',
    sma50:       'var(--color-chart-sma50)',
    sma200:      'var(--color-chart-sma200)',
    rsi:         'var(--color-chart-rsi)',
    macd:        'var(--color-chart-macd)',
    macdSignal:  'var(--color-chart-macd-signal)',
    bb:          'var(--color-chart-bb)',
    grid:        'var(--color-chart-grid)',
    crosshair:   'var(--color-chart-crosshair)',
  },
} as const;

// ── Raw hex values — ONLY for JS APIs that cannot consume CSS variables ──────
// e.g. lightweight-charts createChart() options
// When changing themes, update these to match the new CSS variable values.

export const rawColors = {
  chart: {
    bg:          '#0f1b33',
    textLabel:   '#8ba3c7',
    up:          '#00c087',
    down:        '#ff4b4b',
    volumeUp:    'rgba(0,192,135,0.25)',
    volumeDown:  'rgba(255,75,75,0.25)',
    sma20:       '#f59e0b',
    sma50:       '#4a9eff',
    sma200:      '#a78bfa',
    rsi:         '#a78bfa',
    rsiOb:       '#ff4b4b',  // overbought line
    rsiOs:       '#00c087',  // oversold line
    macd:        '#4a9eff',
    macdSignal:  '#f59e0b',
    macdHistUp:  'rgba(74,158,255,0.7)',
    macdHistDown:'rgba(255,75,75,0.7)',
    bb:          'rgba(167,139,250,0.6)',
    bbMid:       'rgba(167,139,250,0.4)',
    grid:        '#1e3059',
    crosshair:   '#4d6490',
    border:      '#1e3059',
    patternBull: '#00c087',
    patternBear: '#ff4b4b',
    patternNeutral: '#f59e0b',
  },
  bg: {
    page:    '#0b1426',
    panel:   '#0f1b33',
    card:    '#132040',
    elevated:'#1a2b4a',
  },
  text: {
    primary:   '#e8edf5',
    secondary: '#8ba3c7',
    muted:     '#4d6490',
    heading:   '#ffffff',
    inverse:   '#0b1426',
  },
  accent: {
    teal:   '#4a9eff',
    amber:  '#f59e0b',
    orange: '#f97316',
  },
  signal: {
    strongLong:  '#00a073',
    long:        '#00c087',
    neutral:     '#8ba3c7',
    short:       '#ff4b4b',
    strongShort: '#e53935',
  },
  score: {
    excellent: '#00c087',
    good:      '#4a9eff',
    moderate:  '#f59e0b',
    weak:      '#f97316',
    poor:      '#ff4b4b',
    veryPoor:  '#e53935',
    muted:     '#4d6490',
  },
  border: {
    default: '#1e3059',
    subtle:  '#132040',
    focus:   '#4a9eff',
  },
} as const;
