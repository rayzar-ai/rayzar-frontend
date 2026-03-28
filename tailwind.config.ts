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
        // RayZar brand colours — kept in sync with config/brand.config.yaml
        // signal colours used on dashboard and detail pages
        signal: {
          "strong-long": "#16a34a",  // green-600
          "long":        "#4ade80",  // green-400
          "neutral":     "#6b7280",  // gray-500
          "short":       "#f87171",  // red-400
          "strong-short":"#dc2626",  // red-600
        },
        // Regime badge colours
        regime: {
          bull:     "#16a34a",
          bear:     "#dc2626",
          sideways: "#ca8a04",
          volatile: "#7c3aed",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
