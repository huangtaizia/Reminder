import { BrowserWindow } from 'electron';
import crypto from 'node:crypto';
import type { Reminder } from '../shared/types';
import { upsertReminder } from './store';

type TriggerHandler = (reminder: Reminder) => void;
type StateChangedHandler = () => void;

type ScheduleEntry = {
  reminderId: string;
  timeout: NodeJS.Timeout;
  key: string;
};
type WindowedSchedule = Extract<Reminder['schedule'], { type: 'windowedInterval' }>;

function clampMs(ms: number): number {
  const min = 60_000;
  const max = 24 * 60 * 60_000;
  return Math.max(min, Math.min(max, ms));
}

const ONE_SHOT_GRACE_MS = 30_000;

function msUntilNextFixedDaily(hour: number, minute: number, now = new Date()): number {
  const target = new Date(now);
  target.setSeconds(0, 0);
  target.setHours(hour, minute, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target.getTime() - now.getTime();
}

function dayStartMs(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function parseTimeToMinute(hour: number, minute: number): number {
  const h = Math.max(0, Math.min(23, hour));
  const m = Math.max(0, Math.min(59, minute));
  return h * 60 + m;
}

function normalizeWeekdays(days: number[] | undefined): number[] {
  if (!Array.isArray(days)) return [];
  const uniq = new Set<number>();
  for (const d of days) {
    if (Number.isInteger(d) && d >= 0 && d <= 6) uniq.add(d);
  }
  return [...uniq].sort((a, b) => a - b);
}

function nextWindowedCandidateAt(schedule: WindowedSchedule, nowMs = Date.now()): number | null {
  const weekdays = normalizeWeekdays(schedule.weekdays);
  if (weekdays.length === 0) return null;

  const startMinute = parseTimeToMinute(schedule.startHour, schedule.startMinute);
  const endMinute = parseTimeToMinute(schedule.endHour, schedule.endMinute);
  if (startMinute >= endMinute) return null;

  const intervalMs = clampMs(schedule.intervalMs);
  const now = new Date(nowMs);
  const today = now.getDay();
  for (let offset = 0; offset < 14; offset += 1) {
    const day = (today + offset) % 7;
    if (!weekdays.includes(day)) continue;

    const base = dayStartMs(nowMs + offset * 24 * 60 * 60_000);
    const startAt = base + startMinute * 60_000;
    const endAt = base + endMinute * 60_000;

    if (offset === 0) {
      if (nowMs < startAt) return startAt;
      if (nowMs >= endAt) continue;

      const elapsed = nowMs - startAt;
      const step = Math.ceil(elapsed / intervalMs);
      const candidate = startAt + Math.max(0, step) * intervalMs;
      if (candidate < endAt) return candidate;
      continue;
    }

    return startAt;
  }

  return null;
}

function isFixedOnceReminder(reminder: Reminder): reminder is Reminder & {
  schedule: {
    type: 'fixedDaily';
    hour: number;
    minute: number;
    repeat: 'once';
    onceAt?: number;
  };
} {
  return (
    reminder.schedule.type === 'fixedDaily' &&
    reminder.schedule.repeat === 'once'
  );
}

function isWindowedNonRepeatReminder(reminder: Reminder): reminder is Reminder & {
  schedule: WindowedSchedule & { repeat: false };
} {
  return reminder.schedule.type === 'windowedInterval' && reminder.schedule.repeat === false;
}

function msUntilNextFixedDailyAt(hour: number, minute: number, nowMs = Date.now()): number {
  const target = new Date(nowMs);
  target.setSeconds(0, 0);
  target.setHours(hour, minute, 0, 0);
  if (target.getTime() <= nowMs) target.setDate(target.getDate() + 1);
  return target.getTime();
}

export class ReminderScheduler {
  private entries = new Map<string, ScheduleEntry>();
  private onTrigger: TriggerHandler;
  private onStateChanged?: StateChangedHandler;

  constructor(onTrigger: TriggerHandler, opts?: { onStateChanged?: StateChangedHandler }) {
    this.onTrigger = onTrigger;
    this.onStateChanged = opts?.onStateChanged;
  }

  stopAll() {
    for (const e of this.entries.values()) clearTimeout(e.timeout);
    this.entries.clear();
  }

  rescheduleAll(reminders: Reminder[], masterEnabled: boolean) {
    this.stopAll();
    if (!masterEnabled) return;
    for (const r of reminders) this.scheduleOne(r, masterEnabled);
  }

  scheduleOne(reminder: Reminder, masterEnabled: boolean) {
    if (!masterEnabled) return;
    // Treat only explicit false as disabled.
    // (Helps when persisted data is missing `enabled` field.)
    if (reminder.enabled === false) return;

    const key = crypto.randomUUID();
    let effectiveReminder = reminder;

    // For one-shot modes, re-calc onceAt every time we schedule
    // (covers "enable lại" rule).
    if (isFixedOnceReminder(reminder) || isWindowedNonRepeatReminder(reminder)) {
      let nextAt: number | null = null;
      if (isFixedOnceReminder(reminder)) {
        const persistedAt = reminder.schedule.onceAt;
        if (typeof persistedAt === 'number' && Number.isFinite(persistedAt) && persistedAt > Date.now()) {
          nextAt = persistedAt;
        } else {
          nextAt = msUntilNextFixedDailyAt(
            Math.max(0, Math.min(23, reminder.schedule.hour)),
            Math.max(0, Math.min(59, reminder.schedule.minute)),
          );
        }
      } else {
        // Within this branch we're guaranteed to be a windowedInterval one-shot reminder.
        nextAt = nextWindowedCandidateAt(reminder.schedule);
      }

      if (nextAt == null) return;

      const prevAt = reminder.schedule.onceAt;
      const prevAtValid = typeof prevAt === 'number' && Number.isFinite(prevAt);
      if (!prevAtValid || prevAt !== nextAt) {
        const next: Reminder = {
          ...reminder,
          schedule: { ...reminder.schedule, onceAt: nextAt } as Reminder['schedule'],
        };
        upsertReminder(next);
        try { this.onStateChanged?.(); } catch { /* ignore */ }
        effectiveReminder = next;
      }
    }

    const scheduleNext = () => {
      const delay = this.computeDelay(effectiveReminder);
      if (delay == null) {
        this.entries.delete(reminder.id);
        return;
      }

      const timeout = setTimeout(() => {
        // if replaced, ignore
        const current = this.entries.get(reminder.id);
        if (!current || current.key !== key) return;

        this.onTrigger(effectiveReminder);
        if (isFixedOnceReminder(effectiveReminder) || isWindowedNonRepeatReminder(effectiveReminder)) {
          // After firing once, automatically disable the reminder.
          if (effectiveReminder.enabled !== false) {
            // Defer write to avoid blocking the event loop
            // right after triggering the popup.
            setTimeout(() => {
              upsertReminder({ ...effectiveReminder, enabled: false });
              try { this.onStateChanged?.(); } catch { /* ignore */ }
            }, 0);
          }
          this.entries.delete(reminder.id);
          return;
        }
        scheduleNext();
      }, delay);

      this.entries.set(reminder.id, { reminderId: reminder.id, timeout, key });
    };

    scheduleNext();
  }

  unschedule(reminderId: string) {
    const e = this.entries.get(reminderId);
    if (e) clearTimeout(e.timeout);
    this.entries.delete(reminderId);
  }

  private computeDelay(reminder: Reminder): number | null {
    if (reminder.schedule.type === 'interval') {
      const ms = reminder.schedule.intervalMs;
      if (!Number.isFinite(ms) || ms <= 0) return 60_000;
      return clampMs(ms);
    }
    if (reminder.schedule.type === 'fixedDaily') {
      if (reminder.schedule.repeat === 'once') {
        const at = reminder.schedule.onceAt;
        if (typeof at !== 'number' || !Number.isFinite(at)) {
          const fallback = msUntilNextFixedDaily(
            Math.max(0, Math.min(23, reminder.schedule.hour)),
            Math.max(0, Math.min(59, reminder.schedule.minute))
          );
          return clampMs(fallback);
        }
        const ms = at - Date.now();
        if (ms <= 0) return ms >= -ONE_SHOT_GRACE_MS ? 1 : null;
        return ms;
      }
      const ms = msUntilNextFixedDaily(
        Math.max(0, Math.min(23, reminder.schedule.hour)),
        Math.max(0, Math.min(59, reminder.schedule.minute))
      );
      return clampMs(ms);
    }
    if (reminder.schedule.type === 'windowedInterval') {
      if (reminder.schedule.repeat === false) {
        const at = reminder.schedule.onceAt;
        if (typeof at !== 'number' || !Number.isFinite(at)) {
          const fallback = nextWindowedCandidateAt(reminder.schedule);
          if (fallback == null) return null;
          return Math.max(1, fallback - Date.now());
        }
        const ms = at - Date.now();
        if (ms <= 0) return ms >= -ONE_SHOT_GRACE_MS ? 1 : null;
        return ms;
      }

      const next = nextWindowedCandidateAt(reminder.schedule);
      if (next == null) return null;
      const ms = next - Date.now();
      return Math.max(1, ms);
    }
    return 60_000;
  }
}

export function focusAllWindows() {
  // helps popup take focus in edge cases
  for (const w of BrowserWindow.getAllWindows()) {
    if (!w.isVisible()) continue;
    w.focus();
  }
}

