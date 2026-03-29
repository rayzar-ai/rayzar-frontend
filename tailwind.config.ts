import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./shared/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Layout backgrounds ──────────────────────────────────────────────
        background: "#080c14",
        panel:      "#0d1117",
        card:       "#111827",
        elevated:   "#161b22",

        // ── Border ─────────────────────────────────────────────────────────
        border: {
          DEFAULT: "#1e2433",
          subtle:  "#161b22",
          focus:   "#00d4aa",
        },

        // ── Accent colors ───────────────────────────────────────────────────
        accent: {
          teal:  "#00d4aa",
          amber: "#f59e0b",
        },

        // ── Signal colors ───────────────────────────────────────────────────
        signal: {
          "strong-long":  "#059669",
          "long":         "#10b981",
          "neutral":      "#6b7280",
          "short":        "#ef4444",
          "strong-short": "#dc2626",
        },

        // ── Regime colors ───────────────────────────────────────────────────
        regime: {
          bull:       "#10b981",
          recovering: "#f59e0b",
          neutral:    "#6b7280",
          bear:       "#ef4444",
          sideways:   "#ca8a04",
          volatile:   "#7c3aed",
        },

        // ── Text hierarchy ──────────────────────────────────────────────────
        text: {
          primary:   "#e6edf3",
          secondary: "#8b949e",
          muted:     "#484f58",
          disabled:  "#30363d",
        },

        // ── Explicit color overrides for Tailwind utilities ──────────────────
        teal: {
          50:  "#f0fdf9",
          100: "#ccfbef",
          200: "#99f6e0",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#00d4aa",
          600: "#00bfa0",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
        },
      },

      // ── Typography ──────────────────────────────────────────────────────────
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "Cascadia Code", "monospace"],
      },

      // ── Font sizes ──────────────────────────────────────────────────────────
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "1rem" }],
      },

      // ── Spacing ─────────────────────────────────────────────────────────────
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
      },

      // ── Border radius ────────────────────────────────────────────────────────
      borderRadius: {
        "4xl": "2rem",
      },

      // ── Box shadows ──────────────────────────────────────────────────────────
      boxShadow: {
        "teal-glow":  "0 0 16px rgba(0, 212, 170, 0.25)",
        "teal-sm":    "0 0 8px rgba(0, 212, 170, 0.15)",
        "card":       "0 4px 24px rgba(0, 0, 0, 0.4)",
        "panel":      "0 2px 12px rgba(0, 0, 0, 0.5)",
      },

      // ── Animations ───────────────────────────────────────────────────────────
      animation: {
        "fade-in":       "fade-in 0.3s ease forwards",
        "slide-right":   "slide-in-right 0.25s ease forwards",
        "pulse-glow":    "pulse-glow 2s ease-in-out infinite",
        "ticker-scroll": "ticker-scroll 40s linear infinite",
      },

      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(12px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(0,212,170,0.3)", opacity: "1" },
          "50%":      { boxShadow: "0 0 16px 4px rgba(0,212,170,0.3)", opacity: "0.9" },
        },
        "ticker-scroll": {
          "0%":   { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },

      // ── Background gradients ─────────────────────────────────────────────────
      backgroundImage: {
        "health-gradient": "linear-gradient(to right, #dc2626, #ef4444, #f59e0b, #eab308, #10b981, #059669)",
        "signal-long":     "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.05))",
        "signal-short":    "linear-gradient(135deg, rgba(239,68,68,0.1), rgba(220,38,38,0.05))",
      },
    },
  },
  plugins: [],
};

export default config;
