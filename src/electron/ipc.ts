import { app, BrowserWindow, ipcMain, shell } from 'electron';
import crypto from 'node:crypto';
import { readState, writeState, upsertReminder, deleteReminder, setSettings } from './store';
import type { PersistedState, Reminder } from '../shared/types';
import type { ReminderScheduler } from './scheduler';
import { showReminderPopup, previewReminder } from './popup';
import { getAutostartHealth } from './autostart';
import { checkForUpdates } from './updateCheck';

type SchedulerApi = Pick<ReminderScheduler, 'rescheduleAll'>;

export function broadcastStateChanged() {
  for (const win of BrowserWindow.getAllWindows()) {
    try {
      // Renderer listens via preload; popup/dim windows can safely ignore.
      win.webContents.send('state:changed');
    } catch {
      // ignore
    }
  }
}

export function registerIpc(opts?: { scheduler?: SchedulerApi; onSettingsChanged?: (s: PersistedState['settings']) => void }) {
  const scheduler = opts?.scheduler;
  ipcMain.handle('reminder:ping', async () => 'pong');

  ipcMain.handle('window:minimize', async (e) => {
    const win = BrowserWindow.fromWebContents(e.sender);
    win?.minimize();
    return true;
  });

  ipcMain.handle('window:close', async (e) => {
    const win = BrowserWindow.fromWebContents(e.sender);
    // App requirement: run in background => close button hides window (tray keeps running)
    win?.hide();
    return true;
  });

  ipcMain.handle('state:get', async () => {
    return readState();
  });

  ipcMain.handle('app:getVersion', async () => app.getVersion());

  ipcMain.handle('update:check', async () => checkForUpdates());

  ipcMain.handle('update:openDownload', async (_e, url: string) => {
    try {
      const u = new URL(url);
      if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
      await shell.openExternal(url);
      return true;
    } catch {
      return false;
    }
  });

  ipcMain.handle('autostart:status', async () => {
    const state = readState();
    return getAutostartHealth({ startMinimized: !!state.settings.startMinimized });
  });

  ipcMain.handle('state:resetAll', async () => {
    const next: PersistedState = {
      version: 1,
      settings: { darkMode: true, runOnStartup: false, startMinimized: false, masterEnabled: false },
      reminders: [],
    };
    writeState(next);
    scheduler?.rescheduleAll(next.reminders, next.settings.masterEnabled);
    broadcastStateChanged();
    return next;
  });

  ipcMain.handle('settings:set', async (_e, partial: Partial<PersistedState['settings']>) => {
    const next = setSettings(partial);
    scheduler?.rescheduleAll(next.reminders, next.settings.masterEnabled);
    opts?.onSettingsChanged?.(next.settings);
    broadcastStateChanged();
    return next;
  });

  ipcMain.handle('reminder:upsert', async (_e, input: Omit<Reminder, 'id' | 'createdAt'> & Partial<Pick<Reminder, 'id' | 'createdAt'>>) => {
    const id = input.id ?? crypto.randomUUID();
    const createdAt = input.createdAt ?? Date.now();
    const reminder: Reminder = {
      id,
      createdAt,
      enabled: input.enabled ?? true,
      schedule: input.schedule,
      config: input.config,
    };
    const next = upsertReminder(reminder);
    scheduler?.rescheduleAll(next.reminders, next.settings.masterEnabled);
    broadcastStateChanged();
    return next;
  });

  ipcMain.handle('reminder:delete', async (_e, id: string) => {
    const next = deleteReminder(id);
    scheduler?.rescheduleAll(next.reminders, next.settings.masterEnabled);
    broadcastStateChanged();
    return next;
  });

  ipcMain.handle(
    'popup:preview',
    async (
      _e,
      input: {
        icon: string;
        color: string;
        message: string;
        displayMs: number;
      },
    ) => {
      const reminder: Reminder = {
        id: `preview-${crypto.randomUUID()}`,
        createdAt: Date.now(),
        enabled: true,
        schedule: { type: 'interval', intervalMs: 24 * 60 * 60_000 },
        config: {
          icon: input.icon,
          color: input.color,
          message: input.message,
          displayMs: input.displayMs,
        },
      };
      // showReminderPopup(reminder);
      await previewReminder(reminder);
      return true;
    },
  );
}

