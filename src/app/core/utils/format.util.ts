/**
 * Utility functions for formatting durations and hours across the OnTrack application.
 */

/**
 * Formats an hours value for user display.
 * If less than 1 hour (less than 60 minutes), formats as minutes (e.g. "59 mins", "32 mins", "1 min").
 * If 1 hour or more, formats as hours (e.g. "1 hr", "1.5 hrs", "8 hrs").
 */
export function formatHours(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === '') return '0 hrs';
  const num = typeof val === 'string' ? parseFloat(val) : Number(val);
  if (isNaN(num) || num <= 0) return '0 hrs';

  // Less than 1 hour (less than 60 minutes)
  if (num < 1) {
    const mins = Math.round(num * 60);
    if (mins <= 0) return '< 1 min';
    if (mins >= 60) return '1 hr';
    return `${mins} min${mins === 1 ? '' : 's'}`;
  }

  // 1 hour or more
  const formatted = num % 1 === 0 ? num.toString() : num.toFixed(2).replace(/\.?0+$/, '');
  return `${formatted} hr${num === 1 ? '' : 's'}`;
}
