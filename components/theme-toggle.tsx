"use client";

import { Moon, Sun } from "lucide-react";
import { useLayoutEffect, useSyncExternalStore } from "react";

const STORAGE_KEY = "theme";

type Theme = "light" | "dark";

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

export function ThemeToggle() {
  const isLight = useSyncExternalStore(subscribe, isLightNow, isLightOnServer);

  useLayoutEffect(() => {
    // Strict Mode's dev-only remount resets <html> to its JSX attributes and
    // drops the one the inline script set. Re-apply it from storage — a no-op
    // in production, where the script's value survives. The observer above
    // picks the change up, so no state is set here.
    try {
      if (localStorage.getItem(STORAGE_KEY) === "light") {
        applyTheme("light");
      }
    } catch {
      // Storage unavailable: keep whatever the document already has.
    }
  }, []);

  function toggle() {
    const next: Theme = isLight ? "dark" : "light";
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage may be unavailable; the switch still works for this visit.
    }
  }

  return (
    <button
      type="button"
      data-theme-toggle
      aria-label="Светлая тема"
      aria-pressed={isLight}
      onClick={toggle}
      className="nav-toggle inline-flex h-10 w-10 items-center justify-center"
    >
      {/* Both icons ship; CSS picks one from [data-theme], so the icon never
          depends on React state and never disagrees with the server. */}
      <Sun
        className="theme-toggle-sun h-[18px] w-[18px]"
        strokeWidth={1.6}
        aria-hidden="true"
      />
      <Moon
        className="theme-toggle-moon h-[18px] w-[18px]"
        strokeWidth={1.6}
        aria-hidden="true"
      />
    </button>
  );
}
