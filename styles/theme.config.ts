/**
 * styles/theme.config.ts — Theme Switcher
 *
 * Call setTheme() to switch themes. Call loadTheme() on app startup.
 * Theme is persisted to localStorage so it survives page refresh.
 *
 * How themes work:
 * - CSS variable values are defined in app/globals.css per :root[data-theme="X"]
 * - setTheme() sets the data-theme attribute on <html>
 * - All CSS variables update instantly — no component code changes needed
 */

import type { ThemeId } from './themes';

const STORAGE_KEY = 'rayzar-theme';
const DEFAULT_THEME: ThemeId = 'dark';

/**
 * Switch to the given theme.
 * Updates the data-theme attribute on <html> and persists to localStorage.
 */
export function setTheme(themeId: ThemeId): void {
  if (typeof document === 'undefined') return; // SSR guard
  document.documentElement.setAttribute('data-theme', themeId);
  try {
    localStorage.setItem(STORAGE_KEY, themeId);
  } catch {
    // localStorage unavailable (private browsing, etc.) — silently continue
  }
}

/**
 * Load the saved theme from localStorage on app startup.
 * Falls back to dark theme if nothing is saved.
 * Call this in the root layout or a client component that runs early.
 */
export function loadTheme(): void {
  if (typeof localStorage === 'undefined') return; // SSR guard
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
    setTheme(saved ?? DEFAULT_THEME);
  } catch {
    setTheme(DEFAULT_THEME);
  }
}

/**
 * Get the currently active theme id.
 */
export function getActiveTheme(): ThemeId {
  if (typeof document === 'undefined') return DEFAULT_THEME;
  return (document.documentElement.getAttribute('data-theme') as ThemeId) ?? DEFAULT_THEME;
}
