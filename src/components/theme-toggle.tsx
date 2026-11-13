"use client";

import { useTheme } from "./theme-provider";
import { Sun, Moon, Laptop } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="inline-flex items-center gap-1 p-1 bg-surface-container rounded-full border border-border text-muted-foreground">
      <button
        onClick={() => setTheme("light")}
        aria-label="Mode Clair"
        className={`p-1.5 rounded-full transition-colors ${
          theme === "light"
            ? "bg-card text-foreground shadow-xs font-semibold"
            : "hover:text-foreground"
        }`}
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme("dark")}
        aria-label="Mode Sombre"
        className={`p-1.5 rounded-full transition-colors ${
          theme === "dark"
            ? "bg-card text-foreground shadow-xs font-semibold"
            : "hover:text-foreground"
        }`}
      >
        <Moon className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme("system")}
        aria-label="Automatique (Système)"
        className={`p-1.5 rounded-full transition-colors ${
          theme === "system"
            ? "bg-card text-foreground shadow-xs font-semibold"
            : "hover:text-foreground"
        }`}
      >
        <Laptop className="w-4 h-4" />
      </button>
    </div>
  );
}
