/**
 * Utility functions for formatting durations, hours, and times across the OnTrack application.
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

/**
 * Formats a 24-hour military time string (e.g. "16:47:39", "23:00") into 12-hour AM/PM format (e.g. "4:47 PM", "11:00 PM").
 */
export function formatTime(timeStr?: string | null): string {
  if (!timeStr) return '--:--';
  const trimmed = timeStr.trim();
  if (!trimmed || trimmed === '--:--' || trimmed === '--:--:--') return '--:--';

  let timePart = trimmed;
  if (trimmed.includes(' ') || trimmed.includes('T')) {
    const split = trimmed.split(/[ T]/);
    timePart = split[1] || split[0];
  }

  const parts = timePart.split(':');
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    if (isNaN(hours)) return timeStr;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  }
  return timeStr;
}

/**
 * Formats a duty shift range into 12-hour AM/PM format.
 */
export function formatShiftTime(timeIn?: string | null, timeOut?: string | null): string {
  const inStr = formatTime(timeIn);
  if (!timeOut) return `${inStr} — In Progress`;
  const outStr = formatTime(timeOut);
  return `${inStr} — ${outStr}`;
}

