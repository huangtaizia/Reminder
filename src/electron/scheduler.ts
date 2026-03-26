import { BrowserWindow } from 'electron';
import crypto from 'node:crypto';
import type { Reminder } from '../shared/types';

type TriggerHandler = (reminder: Reminder) => void;

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

export class ReminderScheduler {
  private entries = new Map<string, ScheduleEntry>();
  private onTrigger: TriggerHandler;

  constructor(onTrigger: TriggerHandler) {
    this.onTrigger = onTrigger;
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
    const scheduleNext = () => {
      const delay = this.computeDelay(reminder);
      const timeout = setTimeout(() => {
        // if replaced, ignore
        const current = this.entries.get(reminder.id);
        if (!current || current.key !== key) return;

        this.onTrigger(reminder);
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

  private computeDelay(reminder: Reminder): number {
    if (reminder.schedule.type === 'interval') {
      const ms = reminder.schedule.intervalMs;
      if (!Number.isFinite(ms) || ms <= 0) return 60_000;
      return clampMs(ms);
    }
    if (reminder.schedule.type === 'fixedDaily') {
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

