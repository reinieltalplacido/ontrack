import { formatHours, formatShiftTime, formatTime, getTodayLocalIso } from './format.util';

describe('format.util', () => {
  describe('formatHours', () => {
    it('returns "0 hrs" for empty, zero, or invalid inputs', () => {
      expect(formatHours(null)).toBe('0 hrs');
      expect(formatHours(undefined)).toBe('0 hrs');
      expect(formatHours('')).toBe('0 hrs');
      expect(formatHours(0)).toBe('0 hrs');
      expect(formatHours(-3)).toBe('0 hrs');
      expect(formatHours('not-a-number')).toBe('0 hrs');
    });

    it('formats durations under 1 hour as minutes', () => {
      expect(formatHours(0.5)).toBe('30 mins');
      expect(formatHours(1 / 60)).toBe('1 min');
      expect(formatHours(0.001)).toBe('< 1 min');
    });

    it('formats durations of 1 hour or more cleanly', () => {
      expect(formatHours(1)).toBe('1 hr');
      expect(formatHours(1.5)).toBe('1.5 hrs');
      expect(formatHours('8.00')).toBe('8 hrs');
    });
  });

  describe('formatTime & formatShiftTime', () => {
    it('converts 24-hour times to 12-hour AM/PM format', () => {
      expect(formatTime(null)).toBe('--:--');
      expect(formatTime('--:--:--')).toBe('--:--');
      expect(formatTime('00:05:00')).toBe('12:05 AM');
      expect(formatTime('12:30')).toBe('12:30 PM');
      expect(formatTime('16:47:39')).toBe('4:47 PM');
      expect(formatTime('2026-11-11 13:15:00')).toBe('1:15 PM');
    });

    it('formats ongoing and completed shifts', () => {
      expect(formatShiftTime('08:00:00', null)).toBe('8:00 AM — In Progress');
      expect(formatShiftTime('08:00:00', '17:00:00')).toBe('8:00 AM — 5:00 PM');
    });
  });

  describe('getTodayLocalIso', () => {
    it('returns a YYYY-MM-DD local date string matching today', () => {
      const today = new Date();
      const expected = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
        today.getDate()
      ).padStart(2, '0')}`;

      expect(getTodayLocalIso()).toBe(expected);
      expect(getTodayLocalIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});

