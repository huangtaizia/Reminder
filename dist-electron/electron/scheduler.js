"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderScheduler = void 0;
exports.focusAllWindows = focusAllWindows;
const electron_1 = require("electron");
const node_crypto_1 = __importDefault(require("node:crypto"));
function clampMs(ms) {
    const min = 60_000;
    const max = 24 * 60 * 60_000;
    return Math.max(min, Math.min(max, ms));
}
function msUntilNextFixedDaily(hour, minute, now = new Date()) {
    const target = new Date(now);
    target.setSeconds(0, 0);
    target.setHours(hour, minute, 0, 0);
    if (target.getTime() <= now.getTime()) {
        target.setDate(target.getDate() + 1);
    }
    return target.getTime() - now.getTime();
}
class ReminderScheduler {
    entries = new Map();
    onTrigger;
    constructor(onTrigger) {
        this.onTrigger = onTrigger;
    }
    stopAll() {
        for (const e of this.entries.values())
            clearTimeout(e.timeout);
        this.entries.clear();
    }
    rescheduleAll(reminders, masterEnabled) {
        this.stopAll();
        if (!masterEnabled)
            return;
        for (const r of reminders)
            this.scheduleOne(r, masterEnabled);
    }
    scheduleOne(reminder, masterEnabled) {
        if (!masterEnabled)
            return;
        // Treat only explicit false as disabled.
        // (Helps when persisted data is missing `enabled` field.)
        if (reminder.enabled === false)
            return;
        const key = node_crypto_1.default.randomUUID();
        const scheduleNext = () => {
            const delay = this.computeDelay(reminder);
            const timeout = setTimeout(() => {
                // if replaced, ignore
                const current = this.entries.get(reminder.id);
                if (!current || current.key !== key)
                    return;
                this.onTrigger(reminder);
                scheduleNext();
            }, delay);
            this.entries.set(reminder.id, { reminderId: reminder.id, timeout, key });
        };
        scheduleNext();
    }
    unschedule(reminderId) {
        const e = this.entries.get(reminderId);
        if (e)
            clearTimeout(e.timeout);
        this.entries.delete(reminderId);
    }
    computeDelay(reminder) {
        if (reminder.schedule.type === 'interval') {
            const ms = reminder.schedule.intervalMs;
            if (!Number.isFinite(ms) || ms <= 0)
                return 60_000;
            return clampMs(ms);
        }
        if (reminder.schedule.type === 'fixedDaily') {
            const ms = msUntilNextFixedDaily(Math.max(0, Math.min(23, reminder.schedule.hour)), Math.max(0, Math.min(59, reminder.schedule.minute)));
            return clampMs(ms);
        }
        return 60_000;
    }
}
exports.ReminderScheduler = ReminderScheduler;
function focusAllWindows() {
    // helps popup take focus in edge cases
    for (const w of electron_1.BrowserWindow.getAllWindows()) {
        if (!w.isVisible())
            continue;
        w.focus();
    }
}
