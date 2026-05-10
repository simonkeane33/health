'use client';

import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  size?: "sm" | "md";
}

export function ThemeToggle({ className, size = "md" }: ThemeToggleProps) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  const iconSize = size === "sm" ? 16 : 18;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={cn(
        "inline-flex items-center justify-center rounded-full",
        "border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        size === "md" ? "w-11 h-11" : "w-8 h-8",
        "bg-transparent text-[var(--hv-text-muted)] hover:text-[var(--hv-text)] hover:bg-[var(--hv-surface-offset)]",
        className
      )}
    >
      {isDark ? (
        <Sun width={iconSize} height={iconSize} strokeWidth={2} />
      ) : (
        <Moon width={iconSize} height={iconSize} strokeWidth={2} />
      )}
    </button>
  );
}
