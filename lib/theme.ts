import { useLayoutEffect, useSyncExternalStore } from "react";

export const THEME_STORAGE_KEY = "theme";

export type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  if (theme === "light") {
    document.documentElement.setAttribute("data-theme", "light");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

// The attribute on <html> is the single source of truth; React subscribes to
// it rather than keeping a copy that could drift.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

const isLightNow = () =>
  document.documentElement.getAttribute("data-theme") === "light";

// The server always renders the default, so hydration starts from dark.
const isLightOnServer = () => false;

/**
 * Whether the light theme is active. Components that show the theme read it
 * here; visuals themselves belong in CSS keyed on [data-theme], which is set
 * before first paint and therefore never flashes.
 */
export function useIsLightTheme() {
  const isLight = useSyncExternalStore(subscribe, isLightNow, isLightOnServer);

  useLayoutEffect(() => {
    // Strict Mode's dev-only remount resets <html> to its JSX attributes and
    // drops the one the inline script set. Re-apply it from storage — a no-op
    // in production, where the script's value survives.
    try {
      if (localStorage.getItem(THEME_STORAGE_KEY) === "light") {
        applyTheme("light");
      }
    } catch {
      // Storage unavailable: keep whatever the document already has.
    }
  }, []);

  return isLight;
}

export function setTheme(theme: Theme) {
  applyTheme(theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage may be unavailable; the switch still works for this visit.
  }
}
