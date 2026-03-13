// Utility functions for date/time handling
import { format, parse, isValid, startOfDay, endOfDay, addDays, differenceInMinutes } from 'date-fns';

// Parse time string (HH:mm) to Date object
export function parseTime(timeStr: string, baseDate: Date = new Date()): Date | null {
  try {
    const parsed = parse(timeStr, 'HH:mm', baseDate);
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

// Format time for display
export function formatTime(time: Date | string): string {
  if (typeof time === 'string') {
    const parsed = parseTime(time);
    return parsed ? format(parsed, 'HH:mm') : time;
  }
  return format(time, 'HH:mm');
}

// Format time for display with 12-hour format
export function formatTime12(time: Date | string): string {
  if (typeof time === 'string') {
    const parsed = parseTime(time);
    return parsed ? format(parsed, 'h:mm a') : time;
  }
  return format(time, 'h:mm a');
}

// Format date for display
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'EEEE, d MMMM yyyy');
}

// Format date short
export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'd MMM yyyy');
}

// Get time slots between two times
export function getTimeSlots(
  startTime: string,
  endTime: string,
  intervalMinutes: number = 30
): string[] {
  const slots: string[] = [];
  let current = parseTime(startTime);
  const end = parseTime(endTime);

  if (!current || !end) return slots;

  while (current < end) {
    slots.push(format(current, 'HH:mm'));
    current = new Date(current.getTime() + intervalMinutes * 60000);
  }

  return slots;
}

// Calculate session duration in minutes
export function getSessionDuration(startTime: string, endTime: string): number {
  const start = parseTime(startTime);
  const end = parseTime(endTime);

  if (!start || !end) return 0;

  return differenceInMinutes(end, start);
}

// Format duration as human readable
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

// Check if two time ranges overlap
export function timeRangesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = parseTime(start1);
  const e1 = parseTime(end1);
  const s2 = parseTime(start2);
  const e2 = parseTime(end2);

  if (!s1 || !e1 || !s2 || !e2) return false;

  return s1 < e2 && s2 < e1;
}

// Combine date and time into DateTime
export function combineDateAndTime(date: Date, time: string): Date | null {
  const timeParsed = parseTime(time, date);
  return timeParsed;
}

export {
  format,
  parse,
  isValid,
  startOfDay,
  endOfDay,
  addDays,
  differenceInMinutes,
};
