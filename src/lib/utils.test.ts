import { describe, it, expect } from 'vitest';
import { formatDate, formatTime, formatDateTime, formatShortDate, formatNumber } from './utils';

describe('formatDate', () => {
  it('formats a valid ISO string', () => {
    expect(formatDate('2024-01-15T08:00:00Z')).toBe('15 Jan 2024');
  });

  it('formats a date-only string', () => {
    expect(formatDate('2024-01-15')).toBe('15 Jan 2024');
  });

  it('returns em-dash for undefined', () => {
    expect(formatDate(undefined)).toBe('—');
  });

  it('returns em-dash for empty string', () => {
    expect(formatDate('')).toBe('—');
  });

  it('returns em-dash for invalid string', () => {
    expect(formatDate('not-a-date')).toBe('—');
  });

  it('returns em-dash for "Invalid Date" literal', () => {
    expect(formatDate('Invalid Date')).toBe('—');
  });
});

describe('formatTime', () => {
  it('formats a valid ISO string', () => {
    expect(formatTime('2024-01-15T14:30:00Z')).toMatch(/\d{2}:\d{2}/);
  });

  it('returns em-dash for undefined', () => {
    expect(formatTime(undefined)).toBe('—');
  });

  it('returns em-dash for invalid string', () => {
    expect(formatTime('nope')).toBe('—');
  });
});

describe('formatDateTime', () => {
  it('formats a valid ISO string', () => {
    const result = formatDateTime('2024-01-15T14:30:00Z');
    expect(result).toContain('15');
    expect(result).toContain('Jan');
  });

  it('falls back to date-only for YYYY-MM-DD', () => {
    expect(formatDateTime('2024-01-15')).toBe('15 Jan 2024');
  });

  it('returns em-dash for undefined', () => {
    expect(formatDateTime(undefined)).toBe('—');
  });

  it('returns em-dash for invalid string', () => {
    expect(formatDateTime('nope')).toBe('—');
  });
});

describe('formatShortDate', () => {
  it('formats as short date', () => {
    expect(formatShortDate('2024-01-15')).toBe('15 Jan');
  });

  it('returns em-dash for invalid', () => {
    expect(formatShortDate('nope')).toBe('—');
  });
});

describe('formatNumber', () => {
  it('formats a number', () => {
    expect(formatNumber(1234.56, 1)).toBe('1,234.6');
  });

  it('returns em-dash for null', () => {
    expect(formatNumber(null)).toBe('—');
  });

  it('returns em-dash for undefined', () => {
    expect(formatNumber(undefined)).toBe('—');
  });

  it('returns em-dash for NaN', () => {
    expect(formatNumber(NaN)).toBe('—');
  });
});
