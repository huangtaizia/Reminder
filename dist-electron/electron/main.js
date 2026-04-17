"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const node_path_1 = __importDefault(require("node:path"));
const node_fs_1 = __importDefault(require("node:fs"));
const ipc_1 = require("./ipc");
const scheduler_1 = require("./scheduler");
const store_1 = require("./store");
const popup_1 = require("./popup");
const autostart_1 = require("./autostart");
const dataDir = node_path_1.default.join(electron_1.app.getPath('appData'), 'Reminder');
electron_1.app.disableHardwareAcceleration();
electron_1.app.setPath('userData', dataDir);
electron_1.app.setPath('cache', node_path_1.default.join(dataDir, 'cache'));
const isDev = !electron_1.app.isPackaged;
let mainWindow = null;
let tray = null;
let scheduler = undefined;
let isQuitting = false;
console.log("DIR:", __dirname);
function getAppRootPortable() {
    return node_path_1.default.dirname(electron_1.app.getPath('exe'));
}
function ensureDataDir() {
    const preferred = node_path_1.default.join(getAppRootPortable(), 'data');
    try {
        node_fs_1.default.mkdirSync(preferred, { recursive: true });
        node_fs_1.default.accessSync(preferred, node_fs_1.default.constants.W_OK);
        return preferred;
    }
    catch {
        const fallback = node_path_1.default.join(electron_1.app.getPath('userData'), 'data');
        node_fs_1.default.mkdirSync(fallback, { recursive: true });
        return fallback;
    }
}
function createMainWindow(showOnReady) {
    const devIconPath = node_path_1.default.join(process.cwd(), 'build', 'icons', 'win', 'icon.ico');
    const packagedIconPath = node_path_1.default.join(process.resourcesPath, 'icon.ico');
    const windowIconPath = electron_1.app.isPackaged ? packagedIconPath : devIconPath;
    mainWindow = new electron_1.BrowserWindow({
        width: 1240,
        height: 840,
        minWidth: 1240,
        minHeight: 840,
        resizable: true,
        icon: node_fs_1.default.existsSync(windowIconPath) ? windowIconPath : undefined,
        backgroundColor: '#0B1326',
        show: false,
        webPreferences: {
            preload: node_path_1.default.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        titleBarStyle: 'hidden',
        titleBarOverlay: false,
    });
    mainWindow.once('ready-to-show', () => {
        if (!showOnReady)
            return;
        mainWindow?.show();
    });
    if (isDev) {
        mainWindow.loadURL('http://127.0.0.1:5173/');
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
    else {
        mainWindow.loadFile(node_path_1.default.join(__dirname, '../../dist/index.html'));
    }
    electron_1.app.on("before-quit", () => { });
}
function clearAppCacheFiles() {
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
}
async function quitAppAndClearCache() {
    if (isQuitting)
        return;
    isQuitting = true;
    try {
        await electron_1.session.defaultSession.clearCache();
        await electron_1.session.defaultSession.clearStorageData({
            storages: ['cachestorage', 'shadercache'],
        });
    }
    catch {
        // ignore
    }
    clearAppCacheFiles();
    electron_1.app.quit();
}
function createTray() {
    const trayIconPath = electron_1.app.isPackaged
        ? node_path_1.default.join(process.resourcesPath, "tray.png")
        : node_path_1.default.join(process.cwd(), "public", "tray.png");
    let icon = electron_1.nativeImage.createFromPath(trayIconPath);
    // Windows tray icon looks small at 20x20; bump up for better visibility.
    icon = icon.resize({ width: 20, height: 20 });
    if (icon.isEmpty()) {
        console.error("Tray icon failed to load");
    }
    tray = new electron_1.Tray(icon);
    const ctx = electron_1.Menu.buildFromTemplate([
        {
            label: "Mở Reminder",
            click: () => {
                // When reminder popup is active, keep focus locked on the popup.
                if ((0, popup_1.isReminderPopupActive)())
                    return;
                if (!mainWindow || mainWindow.isDestroyed()) {
                    createMainWindow(true);
                    return;
                }
                mainWindow.show();
                mainWindow.focus();
            },
        },
        { type: "separator" },
        {
            label: "Thoát",
            click: () => { void quitAppAndClearCache(); },
        },
    ]);
    tray.setToolTip("Reminder");
    tray.setContextMenu(ctx);
    tray.on("double-click", () => {
        if ((0, popup_1.isReminderPopupActive)())
            return;
        if (!mainWindow || mainWindow.isDestroyed()) {
            createMainWindow(true);
            return;
        }
        mainWindow.show();
        mainWindow.focus();
    });
}
function logPaths() {
    const dataDir = ensureDataDir();
    if (isDev) {
        console.log('[Reminder] dataDir:', dataDir);
    }
}
electron_1.app.whenReady().then(async () => {
    // Keep this aligned with electron-builder build.appId for correct
    // taskbar pin/group identity and icon resolution on Windows.
    electron_1.app.setAppUserModelId("com.hhv.reminder");
    // ── Clear cache khi phát hiện version mới ──
    const currentVersion = electron_1.app.getVersion();
    const savedVersion = (0, store_1.readState)().settings?.lastVersion;
    if (savedVersion !== currentVersion) {
        await electron_1.session.defaultSession.clearCache();
        await electron_1.session.defaultSession.clearStorageData({
            storages: ['cachestorage', 'shadercache']
        });
        (0, store_1.setSettings)({ lastVersion: currentVersion });
        if (isDev)
            console.log('[Reminder] cache cleared for version', currentVersion);
    }
    logPaths();
    scheduler = new scheduler_1.ReminderScheduler((_reminder) => {
        if (isDev)
            console.log('[Reminder] trigger', _reminder.id);
        (0, popup_1.showReminderPopup)(_reminder);
    }, { onStateChanged: ipc_1.broadcastStateChanged });
    const state = (0, store_1.readState)();
    const launchedByAutostart = (0, autostart_1.hasArg)('--autostart');
    const forceMinimized = (0, autostart_1.hasArg)('--minimized');
    const shouldStartHidden = forceMinimized || (launchedByAutostart && !!state.settings.startMinimized);
    (0, autostart_1.setAutostartEnabled)(!!state.settings.runOnStartup, { startMinimized: !!state.settings.startMinimized }).catch((err) => {
        console.warn('[Reminder] Failed to sync startup setting:', err);
    });
    (0, ipc_1.registerIpc)({
        scheduler,
        onSettingsChanged: (s) => {
            (0, autostart_1.setAutostartEnabled)(!!s.runOnStartup, { startMinimized: !!s.startMinimized }).catch((err) => {
                console.warn('[Reminder] Failed to update startup setting:', err);
            });
        },
    });
    createMainWindow(!shouldStartHidden);
    createTray();
    electron_1.ipcMain.handle('quit-app', async () => {
        await quitAppAndClearCache();
        return true;
    });
    scheduler.rescheduleAll(state.reminders, state.settings.masterEnabled);
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createMainWindow(true);
    });
});
electron_1.app.on('window-all-closed', () => {
    // keep running in tray
});
electron_1.app.commandLine.appendSwitch("disable-backgrounding-occluded-windows");
console.log("PRELOAD PATH:", node_path_1.default.join(__dirname, 'preload.js'));
console.log("EXISTS:", node_fs_1.default.existsSync(node_path_1.default.join(__dirname, 'preload.js')));
