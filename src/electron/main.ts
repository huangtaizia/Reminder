import { app, BrowserWindow, Tray, Menu, nativeImage, globalShortcut, ipcMain } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { registerIpc } from './ipc';
import { ReminderScheduler } from './scheduler';
import { readState } from './store';
import { showReminderPopup } from './popup';
import { hasArg, setAutostartEnabled } from './autostart';

const dataDir = path.join(app.getPath('appData'), 'Reminder')

app.disableHardwareAcceleration()
app.setPath('userData', dataDir)
app.setPath('cache', path.join(dataDir, 'cache'))

const isDev = !app.isPackaged;

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let scheduler: ReminderScheduler | null = null;

console.log("DIR:", __dirname);

function getAppRootPortable(): string {
  const exeDir = path.dirname(app.getPath('exe'));
  return exeDir;
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
    width: 560,
    height: 940,
    resizable: false,
    icon: path.join(__dirname, '../../build/icons/icon.ico'),
    backgroundColor: '#07101d',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
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
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  let quitting = false;

  app.on("before-quit", () => {
    quitting = true;
  });
}

function createTray() {

  const trayIconPath = app.isPackaged
    ? path.join(process.resourcesPath, "tray.png")
    : path.join(process.cwd(), "public", "tray.png");

  let icon = nativeImage.createFromPath(trayIconPath);

  icon = icon.resize({
    width: 20,
    height: 20
  });

  if (icon.isEmpty()) {
    console.error("Tray icon failed to load");
  }

  tray = new Tray(icon);

  const ctx = Menu.buildFromTemplate([
    {
      label: "Mở Reminder",
      click: () => {

        if (!mainWindow || mainWindow.isDestroyed()) {
          createMainWindow()
          return
        }
      
        mainWindow.show()
        mainWindow.focus()
      
      },
    },
    { type: "separator" },
    {
      label: "Thoát",
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setToolTip("Reminder");
  tray.setContextMenu(ctx);

  tray.on("double-click", () => {

    if (!mainWindow || mainWindow.isDestroyed()) {
      createMainWindow()
      return
    }
  
    mainWindow.show()
    mainWindow.focus()
  
  })
}

function logPaths() {
  const dataDir = ensureDataDir();
  if (isDev) {
    console.log('[Reminder] dataDir:', dataDir);
  }
}

app.whenReady().then(() => {

  app.setAppUserModelId("com.reminder.app");

  logPaths();

  scheduler = new ReminderScheduler((_reminder) => {

    if (isDev) console.log('[Reminder] trigger', _reminder.id);

    const win = showReminderPopup(_reminder);

    if (!win) return;

    // luôn on top
    win.setAlwaysOnTop(true, "screen-saver");

    // giữ focus dù click màn hình khác
    win.on("blur", () => {
      if (!win.isDestroyed()) {
        win.focus();
      }
    });

    // ESC global (hoạt động dù đang focus màn hình khác)
    globalShortcut.register("Escape", () => {
      if (!win.isDestroyed()) {
        win.close();
      }
    });

    win.on("closed", () => {
      globalShortcut.unregister("Escape");
    });

  });

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

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  // keep running in tray
});
app.commandLine.appendSwitch("disable-backgrounding-occluded-windows");
console.log("PRELOAD PATH:", path.join(__dirname, 'preload.js'));
console.log("EXISTS:", fs.existsSync(path.join(__dirname, 'preload.js')));