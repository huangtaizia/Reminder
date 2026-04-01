export const DEFAULT_MESSAGE = 'Thông điệp nhắc nhở';

export function nextOccurrenceAt(hour: number, minute: number, now = new Date()): number {
  const target = new Date(now);
  target.setSeconds(0, 0);
  target.setHours(hour, minute, 0, 0);
  if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
  return target.getTime();
}
