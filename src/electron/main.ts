import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, session } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { broadcastStateChanged, registerIpc } from './ipc';
import { ReminderScheduler } from './scheduler';
import { readState, setSettings } from './store';
import { isReminderPopupActive, showReminderPopup } from './popup';
import { hasArg, setAutostartEnabled } from './autostart';

const dataDir = path.join(app.getPath('appData'), 'Reminder')

app.disableHardwareAcceleration()
app.setPath('userData', dataDir)
app.setPath('cache', path.join(dataDir, 'cache'))

const isDev = !app.isPackaged;

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let scheduler: ReminderScheduler | undefined = undefined;
let isQuitting = false;

console.log("DIR:", __dirname);

function isLikelyAutoStartLaunch(state: ReturnType<typeof readState>): boolean {
  if (hasArg('--autostart')) return true;

  // Windows may occasionally launch packaged apps at login without preserving
  // custom args. Treat launches early after OS boot as startup launches.
  if (
    process.platform === 'win32'
    && app.isPackaged
    && !!state.settings.runOnStartup
    && !!state.settings.startMinimized
    && process.argv.length <= 1
  ) {
    return os.uptime() <= 180;
  }

  return false;
}

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

function createMainWindow(showOnReady: boolean) {
  const devIconPath = path.join(process.cwd(), 'build', 'icons', 'win', 'icon.ico');
  const packagedIconPath = path.join(process.resourcesPath, 'icon.ico');
  const windowIconPath = app.isPackaged ? packagedIconPath : devIconPath;

  mainWindow = new BrowserWindow({
    width: 1420,
    height: 840,
    minWidth: 1360,
    minHeight: 840,
    resizable: true,
    icon: fs.existsSync(windowIconPath) ? windowIconPath : undefined,
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
    if (!showOnReady) return;
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

function clearAppCacheFiles() {
  const userDataDir = app.getPath('userData');
  const cacheRoots = [
    path.join(userDataDir, 'cache'),
    path.join(userDataDir, 'Cache'),
    path.join(userDataDir, 'Code Cache'),
    path.join(userDataDir, 'GPUCache'),
    path.join(userDataDir, 'DawnCache'),
    path.join(userDataDir, 'GrShaderCache'),
    path.join(userDataDir, 'ShaderCache'),
    path.join(userDataDir, 'Service Worker', 'CacheStorage'),
  ];
  for (const p of cacheRoots) {
    try {
      fs.rmSync(p, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}

async function quitAppAndClearCache() {
  if (isQuitting) return;
  isQuitting = true;
  try {
    await session.defaultSession.clearCache();
    await session.defaultSession.clearStorageData({
      storages: ['cachestorage', 'shadercache'],
    });
  } catch {
    // ignore
  }
  clearAppCacheFiles();
  app.quit();
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
    if (isReminderPopupActive()) return;
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

app.whenReady().then(async () => {
  // Keep this aligned with electron-builder build.appId for correct
  // taskbar pin/group identity and icon resolution on Windows.
  app.setAppUserModelId("com.hhv.reminder");

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
  const forceMinimized = hasArg('--minimized');
  const launchedByAutostart = isLikelyAutoStartLaunch(state);
  const shouldStartHidden = forceMinimized || (launchedByAutostart && !!state.settings.startMinimized);

  setAutostartEnabled(
    !!state.settings.runOnStartup,
    { startMinimized: !!state.settings.startMinimized }
  ).catch((err) => {
    console.warn('[Reminder] Failed to sync startup setting:', err);
  });

  registerIpc({
    scheduler,
    onSettingsChanged: (s) => {
      setAutostartEnabled(
        !!s.runOnStartup,
        { startMinimized: !!s.startMinimized }
      ).catch((err) => {
        console.warn('[Reminder] Failed to update startup setting:', err);
      });
    },
  });

  createMainWindow(!shouldStartHidden);
  createTray();

  ipcMain.handle('quit-app', async () => {
    await quitAppAndClearCache();
    return true;
  });

  scheduler.rescheduleAll(state.reminders, state.settings.masterEnabled);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow(true);
  });
});

app.on('window-all-closed', () => {
  // keep running in tray
});

app.commandLine.appendSwitch("disable-backgrounding-occluded-windows");
console.log("PRELOAD PATH:", path.join(__dirname, 'preload.js'));
console.log("EXISTS:", fs.existsSync(path.join(__dirname, 'preload.js')));