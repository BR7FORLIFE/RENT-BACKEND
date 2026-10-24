export const MS_PER_DAY = 86_400_000;

export function monthStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function addMonths(date: Date, months: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

export function atDay(monthDate: Date, day: number, hour = 0, minute = 0): Date {
  return new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth(), day, hour, minute));
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

export function minDate(...dates: Date[]): Date {
  return new Date(Math.min(...dates.map((date) => date.getTime())));
}

export function maxDate(...dates: Date[]): Date {
  return new Date(Math.max(...dates.map((date) => date.getTime())));
}

export function monthLabel(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function calendarMonth(date: Date): number {
  return date.getUTCMonth() + 1;
}
