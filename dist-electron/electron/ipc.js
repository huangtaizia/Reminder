"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcastStateChanged = broadcastStateChanged;
exports.registerIpc = registerIpc;
const electron_1 = require("electron");
const node_crypto_1 = __importDefault(require("node:crypto"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const store_1 = require("./store");
const popup_1 = require("./popup");
const autostart_1 = require("./autostart");
const updateCheck_1 = require("./updateCheck");
function broadcastStateChanged() {
    for (const win of electron_1.BrowserWindow.getAllWindows()) {
        try {
            // Renderer listens via preload; popup/dim windows can safely ignore.
            win.webContents.send('state:changed');
        }
        catch {
            // ignore
        }
    }
}
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
    electron_1.ipcMain.handle('app:getVersion', async () => electron_1.app.getVersion());
    electron_1.ipcMain.handle('startup:mark', async (_e, label) => {
        if (typeof label !== 'string' || !label.trim())
            return false;
        console.log(`[Startup] renderer ${Date.now()} ${label.trim()}`);
        return true;
    });
    electron_1.ipcMain.handle('update:check', async () => (0, updateCheck_1.checkForUpdates)());
    electron_1.ipcMain.handle('update:openDownload', async (_e, url) => {
        try {
            const u = new URL(url);
            if (u.protocol !== 'https:' && u.protocol !== 'http:')
                return false;
            await electron_1.shell.openExternal(url);
            return true;
        }
        catch {
            return false;
        }
    });
    electron_1.ipcMain.handle('autostart:status', async () => {
        const state = (0, store_1.readState)();
        return (0, autostart_1.getAutostartHealth)({ startMinimized: !!state.settings.startMinimized });
    });
    electron_1.ipcMain.handle('state:resetAll', async () => {
        const next = {
            version: 1,
            settings: { darkMode: true, runOnStartup: false, startMinimized: false, masterEnabled: false },
            reminders: [],
        };
        (0, store_1.writeState)(next);
        scheduler?.rescheduleAll(next.reminders, next.settings.masterEnabled);
        broadcastStateChanged();
        return next;
    });
    electron_1.ipcMain.handle('cache:clear', async () => {
        try {
            await electron_1.session.defaultSession.clearCache();
            await electron_1.session.defaultSession.clearStorageData({
                storages: ['cachestorage', 'shadercache'],
            });
        }
        catch {
            // ignore runtime cache clear failures
        }
        const userDataDir = electron_1.app.getPath('userData');
        const cacheRoots = [
            node_path_1.default.join(userDataDir, 'cache'),
            node_path_1.default.join(userDataDir, 'Cache'),
            node_path_1.default.join(userDataDir, 'Code Cache'),
            node_path_1.default.join(userDataDir, 'GPUCache'),
            node_path_1.default.join(userDataDir, 'DawnCache'),
            node_path_1.default.join(userDataDir, 'GrShaderCache'),
            node_path_1.default.join(userDataDir, 'ShaderCache'),
            node_path_1.default.join(userDataDir, 'Service Worker', 'CacheStorage'),
        ];
        for (const p of cacheRoots) {
            try {
                node_fs_1.default.rmSync(p, { recursive: true, force: true });
            }
            catch {
                // ignore
            }
        }
        return true;
    });
    electron_1.ipcMain.handle('settings:set', async (_e, partial) => {
        const next = (0, store_1.setSettings)(partial);
        scheduler?.rescheduleAll(next.reminders, next.settings.masterEnabled);
        opts?.onSettingsChanged?.(next.settings);
        broadcastStateChanged();
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
        broadcastStateChanged();
        return next;
    });
    electron_1.ipcMain.handle('reminder:delete', async (_e, id) => {
        const next = (0, store_1.deleteReminder)(id);
        scheduler?.rescheduleAll(next.reminders, next.settings.masterEnabled);
        broadcastStateChanged();
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
