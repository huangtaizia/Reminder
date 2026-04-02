import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, session } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { broadcastStateChanged, registerIpc } from './ipc';
import { ReminderScheduler } from './scheduler';
import { readState, setSettings } from './store';
import { isReminderPopupActive, showReminderPopup } from './popup';
import { setAutostartEnabled } from './autostart';

const dataDir = path.join(app.getPath('appData'), 'Reminder')

app.disableHardwareAcceleration()
app.setPath('userData', dataDir)
app.setPath('cache', path.join(dataDir, 'cache'))

const isDev = !app.isPackaged;

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let scheduler: ReminderScheduler | undefined = undefined;

console.log("DIR:", __dirname);

function getAppRootPortable(): string {
  return path.dirname(app.getPath('exe'));
}

function ensureDataDir(): string {
  const preferred = path.join(getAppRootPortable(), 'data');
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

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 840,
    minWidth: 1240,
    minHeight: 840,
    resizable: true,
    icon: path.join(__dirname, '../../build/icons/icon.ico'),
    backgroundColor: '#0B1326',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hidden',
    titleBarOverlay: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  if (isDev) {
    mainWindow.loadURL('http://127.0.0.1:5173/');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  app.on("before-quit", () => {});
}

function createTray() {
  const trayIconPath = app.isPackaged
    ? path.join(process.resourcesPath, "tray.png")
    : path.join(process.cwd(), "public", "tray.png");

  let icon = nativeImage.createFromPath(trayIconPath);
  // Windows tray icon looks small at 20x20; bump up for better visibility.
  icon = icon.resize({ width: 20, height: 20 });

  if (icon.isEmpty()) {
    console.error("Tray icon failed to load");
  }

  tray = new Tray(icon);

  const ctx = Menu.buildFromTemplate([
    {
      label: "Mở Reminder",
      click: () => {
        // When reminder popup is active, keep focus locked on the popup.
        if (isReminderPopupActive()) return;
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
      click: () => { app.quit(); },
    },
  ]);

  tray.setToolTip("Reminder");
  tray.setContextMenu(ctx);

  tray.on("double-click", () => {
    if (isReminderPopupActive()) return;
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

app.whenReady().then(async () => {
  app.setAppUserModelId("com.reminder.app");

  // ── Clear cache khi phát hiện version mới ──
  const currentVersion = app.getVersion();
  const savedVersion = readState().settings?.lastVersion as string | undefined;
  if (savedVersion !== currentVersion) {
    await session.defaultSession.clearCache();
    await session.defaultSession.clearStorageData({
      storages: ['cachestorage', 'shadercache']
    });
    setSettings({ lastVersion: currentVersion } as any);
    if (isDev) console.log('[Reminder] cache cleared for version', currentVersion);
  }

  logPaths();

  scheduler = new ReminderScheduler((_reminder) => {
    if (isDev) console.log('[Reminder] trigger', _reminder.id);
    showReminderPopup(_reminder);
  }, { onStateChanged: broadcastStateChanged });

  const state = readState();

  setAutostartEnabled(
    !!state.settings.runOnStartup,
    { startMinimized: !!state.settings.startMinimized }
  ).catch(() => {});

  registerIpc({
    scheduler,
    onSettingsChanged: (s) => {
      setAutostartEnabled(
        !!s.runOnStartup,
        { startMinimized: !!s.startMinimized }
      ).catch(() => {});
    },
  });

  createMainWindow();
  createTray();

  ipcMain.handle('quit-app', () => {
    app.quit();
  });

  scheduler.rescheduleAll(state.reminders, state.settings.masterEnabled);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  // keep running in tray
});

app.commandLine.appendSwitch("disable-backgrounding-occluded-windows");
console.log("PRELOAD PATH:", path.join(__dirname, 'preload.js'));
console.log("EXISTS:", fs.existsSync(path.join(__dirname, 'preload.js')));