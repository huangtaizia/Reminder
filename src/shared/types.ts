export type Id = string;

export type ReminderSchedule =
  | { type: 'interval'; intervalMs: number }
  | { type: 'fixedDaily'; hour: number; minute: number };

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
};

export type PersistedState = {
  version: 1;
  settings: AppSettings;
  reminders: Reminder[];
};

