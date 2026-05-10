'use client';

import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ThemeToggleProps {
  className?: string;
  size?: "sm" | "md";
}

export function ThemeToggle({ className, size = "md" }: ThemeToggleProps) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  const iconSize = size === "sm" ? 16 : 18;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={cn(
        "rounded-full",
        size === "md" ? "w-11 h-11" : "w-8 h-8",
        className
      )}
    >
      {isDark ? (
        <Sun width={iconSize} height={iconSize} strokeWidth={2} />
      ) : (
        <Moon width={iconSize} height={iconSize} strokeWidth={2} />
      )}
    </Button>
  );
}
