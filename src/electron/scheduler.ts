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

function clampMs(ms: number): number {
  const min = 60_000;
  const max = 24 * 60 * 60_000;
  return Math.max(min, Math.min(max, ms));
}

function msUntilNextFixedDaily(hour: number, minute: number, now = new Date()): number {
  const target = new Date(now);
  target.setSeconds(0, 0);
  target.setHours(hour, minute, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target.getTime() - now.getTime();
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

    // For "once" mode, re-calc onceAt every time we schedule
    // (covers "enable lại" rule).
    if (isFixedOnceReminder(reminder)) {
      const nextAt = msUntilNextFixedDailyAt(
        Math.max(0, Math.min(23, reminder.schedule.hour)),
        Math.max(0, Math.min(59, reminder.schedule.minute)),
      );

      const prevAt = reminder.schedule.onceAt;
      const prevAtValid = typeof prevAt === 'number' && Number.isFinite(prevAt);
      if (!prevAtValid || prevAt !== nextAt) {
        const next: Reminder = {
          ...reminder,
          schedule: { ...reminder.schedule, onceAt: nextAt },
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
        if (isFixedOnceReminder(effectiveReminder)) {
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
        if (ms <= 0) return null;
        return ms;
      }
      const ms = msUntilNextFixedDaily(
        Math.max(0, Math.min(23, reminder.schedule.hour)),
        Math.max(0, Math.min(59, reminder.schedule.minute))
      );
      return clampMs(ms);
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

