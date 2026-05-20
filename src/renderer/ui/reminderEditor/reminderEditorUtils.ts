export const DEFAULT_MESSAGE = 'Thông điệp nhắc nhở';

export function nextOccurrenceAt(hour: number, minute: number, now = new Date()): number {
  const target = new Date(now);
  target.setSeconds(0, 0);
  target.setHours(hour, minute, 0, 0);
  if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
  return target.getTime();
}

export function toDateInputValue(d = new Date()): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function atDateAndTime(dateValue: string, hour: number, minute: number): number | null {
  if (!dateValue) return null;
  const m = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
  const target = new Date(y, mo, d);
  target.setSeconds(0, 0);
  target.setHours(
    Math.max(0, Math.min(23, hour)),
    Math.max(0, Math.min(59, minute)),
    0,
    0,
  );
  if (Number.isNaN(target.getTime())) return null;
  return target.getTime();
}
