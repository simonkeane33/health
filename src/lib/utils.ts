import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(iso: string | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatTime(iso: string | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(iso: string | undefined): string {
  if (!iso) return '—';
  // If the value is a date-only string (no time component), show just the date.
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(iso);
  if (isDateOnly) return formatDate(iso);
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatNumber(value: number | null | undefined, decimals = 0): string {
  if (value == null || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals }).format(value);
}
