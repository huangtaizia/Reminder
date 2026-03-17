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
let scheduler = null;
console.log("DIR:", __dirname);
function getAppRootPortable() {
    const exeDir = node_path_1.default.dirname(electron_1.app.getPath('exe'));
    return exeDir;
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
function createMainWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 560,
        height: 940,
        resizable: false,
        icon: node_path_1.default.join(__dirname, '../../build/icons/icon.ico'),
        backgroundColor: '#07101d',
        webPreferences: {
            preload: node_path_1.default.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        titleBarStyle: 'hidden',
        titleBarOverlay: false,
    });
    if (isDev) {
        mainWindow.once("ready-to-show", () => {
            mainWindow?.show();
        });
        mainWindow.loadURL('http://127.0.0.1:5173/');
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
    else {
        mainWindow.loadFile(node_path_1.default.join(__dirname, '../../dist/index.html'));
    }
    let quitting = false;
    electron_1.app.on("before-quit", () => {
        quitting = true;
    });
}
function createTray() {
    const trayIconPath = electron_1.app.isPackaged
        ? node_path_1.default.join(process.resourcesPath, "tray.png")
        : node_path_1.default.join(process.cwd(), "public", "tray.png");
    let icon = electron_1.nativeImage.createFromPath(trayIconPath);
    icon = icon.resize({
        width: 20,
        height: 20
    });
    if (icon.isEmpty()) {
        console.error("Tray icon failed to load");
    }
    tray = new electron_1.Tray(icon);
    const ctx = electron_1.Menu.buildFromTemplate([
        {
            label: "Mở Reminder",
            click: () => {
                if (!mainWindow || mainWindow.isDestroyed()) {
                    createMainWindow();
                    return;
                }
                mainWindow.show();
                mainWindow.focus();
            },
        },
        { type: "separator" },
        {
            label: "Thoát",
            click: () => {
                electron_1.app.quit();
            },
        },
    ]);
    tray.setToolTip("Reminder");
    tray.setContextMenu(ctx);
    tray.on("double-click", () => {
        if (!mainWindow || mainWindow.isDestroyed()) {
            createMainWindow();
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
electron_1.app.whenReady().then(() => {
    electron_1.app.setAppUserModelId("com.reminder.app");
    logPaths();
    scheduler = new scheduler_1.ReminderScheduler((_reminder) => {
        if (isDev)
            console.log('[Reminder] trigger', _reminder.id);
        const win = (0, popup_1.showReminderPopup)(_reminder);
        if (!win)
            return;
        // luôn on top
        win.setAlwaysOnTop(true, "screen-saver");
        // giữ focus dù click màn hình khác
        win.on("blur", () => {
            if (!win.isDestroyed()) {
                win.focus();
            }
        });
        // ESC global (hoạt động dù đang focus màn hình khác)
        electron_1.globalShortcut.register("Escape", () => {
            if (!win.isDestroyed()) {
                win.close();
            }
        });
        win.on("closed", () => {
            electron_1.globalShortcut.unregister("Escape");
        });
    });
    const state = (0, store_1.readState)();
    (0, autostart_1.setAutostartEnabled)(!!state.settings.runOnStartup, { startMinimized: !!state.settings.startMinimized }).catch(() => { });
    (0, ipc_1.registerIpc)({
        scheduler,
        onSettingsChanged: (s) => {
            (0, autostart_1.setAutostartEnabled)(!!s.runOnStartup, { startMinimized: !!s.startMinimized }).catch(() => { });
        },
    });
    createMainWindow();
    createTray();
    scheduler.rescheduleAll(state.reminders, state.settings.masterEnabled);
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createMainWindow();
    });
});
electron_1.app.on('will-quit', () => {
    electron_1.globalShortcut.unregisterAll();
});
electron_1.app.on('window-all-closed', () => {
    // keep running in tray
});
electron_1.app.commandLine.appendSwitch("disable-backgrounding-occluded-windows");
console.log("PRELOAD PATH:", node_path_1.default.join(__dirname, 'preload.js'));
console.log("EXISTS:", node_fs_1.default.existsSync(node_path_1.default.join(__dirname, 'preload.js')));
