"use client";

export type ThemeName = "light" | "dark";

const THEME_KEY = "shop.theme";

function isBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

export function getStoredTheme(): ThemeName {
  if (!isBrowser()) {
    return "light";
  }
  const stored = window.localStorage.getItem(THEME_KEY);
  return stored === "dark" ? "dark" : "light";
}

export function applyThemeClass(theme: ThemeName) {
  if (!isBrowser()) {
    return;
  }
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export function setTheme(theme: ThemeName) {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.setItem(THEME_KEY, theme);
  applyThemeClass(theme);
}

export function initializeTheme(): ThemeName {
  const theme = getStoredTheme();
  applyThemeClass(theme);
  return theme;
}
