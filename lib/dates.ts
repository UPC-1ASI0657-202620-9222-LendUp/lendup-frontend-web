import { appConfig } from '../config/app-config.ts';

const DAY_MS = 86_400_000;
const timeZone = appConfig.timeZone;

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

function zonedParts(date: Date) {
  const parts = Object.fromEntries(
    partsFormatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  ) as Record<'year' | 'month' | 'day' | 'hour' | 'minute' | 'second', number>;
  return parts;
}

const pad = (value: number) => String(value).padStart(2, '0');

function offsetMs(date: Date) {
  const p = zonedParts(date);
  return (
    Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) -
    Math.floor(date.getTime() / 1000) * 1000
  );
}

export function zonedDayKey(value: Date | string) {
  const p = zonedParts(new Date(value));
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

export function dayFromKey(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

export function addDays(day: Date, amount: number) {
  return new Date(day.getTime() + amount * DAY_MS);
}

export function addMonths(day: Date, amount: number) {
  return new Date(
    Date.UTC(day.getUTCFullYear(), day.getUTCMonth() + amount, 1, 12),
  );
}

export function startOfMonth(day: Date) {
  return new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), 1, 12));
}

export function startOfWeek(day: Date) {
  return addDays(day, -((day.getUTCDay() + 6) % 7));
}

export function today() {
  return dayFromKey(zonedDayKey(new Date()));
}

export function toZonedInput(value: string | Date) {
  const p = zonedParts(new Date(value));
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

export function fromZonedInput(value: string) {
  if (!value) return '';
  const [date, time = '00:00'] = value.split('T');
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const first = guess - offsetMs(new Date(guess));
  return new Date(guess - offsetMs(new Date(first))).toISOString();
}

/**
 * Serializes an instant using the backend's timezone-less LocalDateTime
 * contract (`yyyy-MM-ddTHH:mm:ss`) in the configured application timezone.
 */
export function toApiLocalDateTime(value: string | Date) {
  const p = zonedParts(new Date(value));
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}`;
}

/** Converts the backend's timezone-less LocalDateTime into an ISO instant. */
export function fromApiLocalDateTime(value: string) {
  if (!value) return '';
  if (value.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(value)) {
    return new Date(value).toISOString();
  }
  return fromZonedInput(value.replace(' ', 'T'));
}

export function atZonedTime(day: Date | string, hour: number, minute = 0) {
  const key = typeof day === 'string' ? day : zonedDayKey(day);
  return fromZonedInput(`${key}T${pad(hour)}:${pad(minute)}`);
}
