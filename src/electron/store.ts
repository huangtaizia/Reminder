import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import type { PersistedState, Reminder, AppSettings } from '../shared/types';

const DEFAULT_SETTINGS: AppSettings = {
  darkMode: true,
  runOnStartup: false,
  startMinimized: false,
  masterEnabled: false,
};

function getPortableRoot(): string {
  return path.dirname(app.getPath('exe'));
}

function ensureWritableDir(): string {
  // In dev, app.getPath("exe") points to Electron inside node_modules (often not writable).
  // Use userData for dev; use portable folder for packaged builds.
  const preferred = app.isPackaged ? path.join(getPortableRoot(), 'data') : path.join(app.getPath('userData'), 'data');
  try {
    fs.mkdirSync(preferred, { recursive: true });
    fs.accessSync(preferred, fs.constants.W_OK);
    return preferred;
  } catch {
    const fallback = path.join(app.getPath('userData'), 'data');
    fs.mkdirSync(fallback, { recursive: true });
    return fallback;
  }
}

function statePath(): string {
  return path.join(ensureWritableDir(), 'state.json');
}

export function readState(): PersistedState {
  const p = statePath();
  try {
    const raw = fs.readFileSync(p, 'utf-8');
    const parsed = JSON.parse(raw) as PersistedState;
    if (parsed?.version !== 1) throw new Error('unsupported version');
    return parsed;
  } catch {
    return {
      version: 1,
      settings: DEFAULT_SETTINGS,
      reminders: [],
    };
  }
}

export function writeState(next: PersistedState) {
  const p = statePath();
  fs.writeFileSync(p, JSON.stringify(next, null, 2), 'utf-8');
}

export function upsertReminder(reminder: Reminder): PersistedState {
  const state = readState();
  const idx = state.reminders.findIndex((r) => r.id === reminder.id);
  const reminders = [...state.reminders];
  if (idx >= 0) reminders[idx] = reminder;
  else reminders.unshift(reminder); // newest first
  const next = { ...state, reminders };
  writeState(next);
  return next;
}

export function deleteReminder(id: string): PersistedState {
  const state = readState();
  const next = { ...state, reminders: state.reminders.filter((r) => r.id !== id) };
  writeState(next);
  return next;
}

export function setSettings(partial: Partial<PersistedState['settings']>): PersistedState {
  const state = readState();
  const next = { ...state, settings: { ...state.settings, ...partial } };
  writeState(next);
  return next;
}

