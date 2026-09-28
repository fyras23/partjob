"use client";

import { createContext, startTransition, useContext, useEffect, useState } from "react";

export type ThemePreference = "light" | "dark" | "system";

interface ThemeContextValue {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = "partjob-theme";

function readPreference(): ThemePreference {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
  } catch {
    return "system";
  }
}

function applyPreference(preference: ThemePreference) {
  const theme = preference === "system"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    : preference;

  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>("system");

  useEffect(() => {
    const initialPreference = readPreference();
    applyPreference(initialPreference);
    startTransition(() => setPreferenceState(initialPreference));

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystemTheme = () => {
      if (readPreference() === "system") applyPreference("system");
    };
    media.addEventListener("change", updateSystemTheme);
    return () => media.removeEventListener("change", updateSystemTheme);
  }, []);

  function setPreference(nextPreference: ThemePreference) {
    setPreferenceState(nextPreference);
    try {
      window.localStorage.setItem(STORAGE_KEY, nextPreference);
    } catch {
      // Keep the in-memory theme usable when storage is unavailable.
    }
    applyPreference(nextPreference);
  }

  return (
    <ThemeContext.Provider value={{ preference, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}