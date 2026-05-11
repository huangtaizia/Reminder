import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { broadcastStateChanged, registerIpc } from './ipc';
import { ReminderScheduler } from './scheduler';
import { readState, setSettings } from './store';
import { isReminderPopupActive, showReminderPopup } from './popup';
import { hasArg, setAutostartEnabled } from './autostart';

const dataDir = path.join(app.getPath('appData'), 'Reminder')
const startupT0 = Date.now();

app.setPath('userData', dataDir)
app.setPath('cache', path.join(dataDir, 'cache'))

const isDev = !app.isPackaged;

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let scheduler: ReminderScheduler | undefined = undefined;

function logStartup(step: string) {
  if (!isDev && !hasArg('--startup-prof')) return;
  console.log(`[Startup] ${Date.now() - startupT0}ms ${step}`);
}

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
  logStartup('main-window-created');

  let revealed = false;
  const revealWindow = () => {
    if (revealed || !showOnReady) return;
    revealed = true;
    if (!mainWindow || mainWindow.isDestroyed()) return;
    mainWindow.show();
    logStartup('main-window-shown');
  };
  mainWindow.once('ready-to-show', revealWindow);
  mainWindow.webContents.once('did-finish-load', revealWindow);
  mainWindow.webContents.once('did-finish-load', () => logStartup('renderer-did-finish-load'));
  mainWindow.once('ready-to-show', () => logStartup('main-window-ready-to-show'));
  // Fallback to avoid waiting too long on ready-to-show in heavy environments.
  setTimeout(revealWindow, 1200);

  if (isDev) {
    mainWindow.loadURL('http://127.0.0.1:5173/');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }
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
      click: () => { app.quit(); },
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
  if (!isDev) return;
  const portableDataDir = ensureDataDir();
  console.log('[Reminder] dataDir:', portableDataDir);
}

app.whenReady().then(async () => {
  // Keep this aligned with electron-builder build.appId for correct
  // taskbar pin/group identity and icon resolution on Windows.
  app.setAppUserModelId("com.hhv.reminder");
  logStartup('app-when-ready');

  logPaths();

  scheduler = new ReminderScheduler((_reminder) => {
    if (isDev) console.log('[Reminder] trigger', _reminder.id);
    showReminderPopup(_reminder);
  }, { onStateChanged: broadcastStateChanged });

  const state = readState();
  const forceMinimized = hasArg('--minimized');
  const launchedByAutostart = isLikelyAutoStartLaunch(state);
  const shouldStartHidden = forceMinimized || (launchedByAutostart && !!state.settings.startMinimized);

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
  scheduler.rescheduleAll(state.reminders, state.settings.masterEnabled);
  logStartup('scheduler-reschedule-done');

  // Defer non-critical boot tasks until first window pipeline has started.
  setTimeout(() => {
    const currentVersion = app.getVersion();
    const savedVersion = state.settings?.lastVersion as string | undefined;
    if (savedVersion !== currentVersion) {
      setSettings({ lastVersion: currentVersion } as any);
      if (isDev) console.log('[Reminder] version updated', currentVersion);
    }
  }, 500);

  setTimeout(() => {
    setAutostartEnabled(
      !!state.settings.runOnStartup,
      { startMinimized: !!state.settings.startMinimized }
    ).catch((err) => {
      console.warn('[Reminder] Failed to sync startup setting:', err);
    });
  }, 900);

  setTimeout(() => {
    createTray();
    logStartup('tray-created');
  }, 1200);

  ipcMain.handle('quit-app', async () => {
    app.quit();
    return true;
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow(true);
  });
});

app.on('window-all-closed', () => {
  // keep running in tray
});

app.commandLine.appendSwitch("disable-backgrounding-occluded-windows");