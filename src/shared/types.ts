export type Id = string;

export type ReminderSchedule =
  | { type: 'interval'; intervalMs: number }
  | {
      type: 'fixedDaily';
      hour: number;
      minute: number;
      repeat?: 'daily' | 'once';
      // Used when repeat = "once" to persist one-shot behavior across restarts.
      onceAt?: number;
    }
  | {
      type: 'windowedInterval';
      intervalMs: number;
      startHour: number;
      startMinute: number;
      endHour: number;
      endMinute: number;
      // 0 = Sunday ... 6 = Saturday
      weekdays: number[];
      repeat: boolean;
      // Used when repeat = false to persist one-shot behavior across restarts.
      onceAt?: number;
    };

export type ReminderConfig = {
  icon: string;
  color: string; // hex
  message: string;
  displayMs: number; // popup countdown duration
};

export type Reminder = {
  id: Id;
  createdAt: number; // epoch ms
  enabled: boolean;
  schedule: ReminderSchedule;
  config: ReminderConfig;
};

export type AppSettings = {
  darkMode: boolean;
  runOnStartup: boolean;
  startMinimized: boolean;
  masterEnabled: boolean;
  lastVersion?: string;
};

export type PersistedState = {
  version: 1;
  settings: AppSettings;
  reminders: Reminder[];
};

