"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerIpc = registerIpc;
const electron_1 = require("electron");
const node_crypto_1 = __importDefault(require("node:crypto"));
const store_1 = require("./store");
const popup_1 = require("./popup");
function registerIpc(opts) {
    const scheduler = opts?.scheduler;
    electron_1.ipcMain.handle('reminder:ping', async () => 'pong');
    electron_1.ipcMain.handle('window:minimize', async (e) => {
        const win = electron_1.BrowserWindow.fromWebContents(e.sender);
        win?.minimize();
        return true;
    });
    electron_1.ipcMain.handle('window:close', async (e) => {
        const win = electron_1.BrowserWindow.fromWebContents(e.sender);
        // App requirement: run in background => close button hides window (tray keeps running)
        win?.hide();
        return true;
    });
    electron_1.ipcMain.handle('state:get', async () => {
        return (0, store_1.readState)();
    });
    electron_1.ipcMain.handle('state:resetAll', async () => {
        const next = {
            version: 1,
            settings: { darkMode: true, runOnStartup: false, startMinimized: false, masterEnabled: false },
            reminders: [],
        };
        (0, store_1.writeState)(next);
        scheduler?.rescheduleAll(next.reminders, next.settings.masterEnabled);
        return next;
    });
    electron_1.ipcMain.handle('settings:set', async (_e, partial) => {
        const next = (0, store_1.setSettings)(partial);
        scheduler?.rescheduleAll(next.reminders, next.settings.masterEnabled);
        opts?.onSettingsChanged?.(next.settings);
        return next;
    });
    electron_1.ipcMain.handle('reminder:upsert', async (_e, input) => {
        const id = input.id ?? node_crypto_1.default.randomUUID();
        const createdAt = input.createdAt ?? Date.now();
        const reminder = {
            id,
            createdAt,
            enabled: input.enabled ?? true,
            schedule: input.schedule,
            config: input.config,
        };
        const next = (0, store_1.upsertReminder)(reminder);
        scheduler?.rescheduleAll(next.reminders, next.settings.masterEnabled);
        return next;
    });
    electron_1.ipcMain.handle('reminder:delete', async (_e, id) => {
        const next = (0, store_1.deleteReminder)(id);
        scheduler?.rescheduleAll(next.reminders, next.settings.masterEnabled);
        return next;
    });
    electron_1.ipcMain.handle('popup:preview', async (_e, input) => {
        const reminder = {
            id: `preview-${node_crypto_1.default.randomUUID()}`,
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
        await (0, popup_1.previewReminder)(reminder);
        return true;
    });
}
