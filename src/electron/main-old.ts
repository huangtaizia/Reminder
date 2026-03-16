import { app, BrowserWindow, Tray, Menu, nativeImage } from 'electron';
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
app.whenReady().then(() => {
  createMainWindow()
})

const isDev = !app.isPackaged;

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let scheduler: ReminderScheduler | null = null;

console.log("DIR:", __dirname);
function getAppRootPortable(): string {
  // Portable: store data next to executable if possible
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
      //preload: path.join(__dirname, `preload.${isDev ? "ts" : "js"}`)
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

  const state = readState();
  const shouldStartMinimized = !isDev && state.settings.startMinimized && (hasArg('--autostart') || hasArg('--minimized'));
  // if (shouldStartMinimized) {
  //   mainWindow.once('ready-to-show', () => {
  //     mainWindow?.hide();
  //   });
  // }
  let quitting = false;

  app.on("before-quit", () => {
    quitting = true;
  });
  // mainWindow.on('close', (e) => {
  //   // Default: close -> minimize to tray (still running)
  //   if (!quitting) {
  //     e.preventDefault();
  //     mainWindow?.hide();
  //   }
  // });
}

function createTray() {

  const trayIconPath = app.isPackaged
    ? path.join(process.resourcesPath, "tray.png")
    : path.join(process.cwd(), "public", "tray.png");
  console.log("TRAY ICON PATH:", trayIconPath);
  console.log("EXISTS:", fs.existsSync(trayIconPath));

  let icon = nativeImage.createFromPath(trayIconPath);
  // resize để Windows render sắc nét
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
        mainWindow?.show();
        mainWindow?.focus();
      },
    },
    { type: "separator" },
    {
      label: "Thoát",
      click: () => {
        app.exit(0);
      },
    },
  ]);

  tray.setToolTip("Reminder");
  tray.setContextMenu(ctx);

  tray.on("double-click", () => {
    mainWindow?.show();
    mainWindow?.focus();
  });
}
// function createTray() {
//   // const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
//   //   <path d="M32 4C47 24 60 38 60 48c0 10-12 12-28 12S4 58 4 48C4 38 17 24 32 4Z" fill="#23a7f3"/>
//   // </svg>`;
//   // const icon = nativeImage.createFromDataURL(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
//   // tray = new Tray(icon);
//   const trayIconPath = path.join(__dirname, '../../build/icons/png/32x32.png');
//   const icon = nativeImage.createFromPath(trayIconPath);
//   tray = new Tray(icon);
//   console.log("TRAY ICON PATH:", trayIconPath);
//   console.log("TRAY ICON:", icon);
//   console.log("TRAY:", tray);
//   const ctx = Menu.buildFromTemplate([
//     {
//       label: 'Mở Reminder',
//       click: () => {
//         mainWindow?.show();
//         mainWindow?.focus();
//       },
//     },
//     { type: 'separator' },
//     {
//       label: 'Thoát',
//       click: () => {
//         app.exit(0);
//       },
//     },
//   ]);
//   tray.setToolTip('Reminder');
//   tray.setContextMenu(ctx);
//   tray.on('double-click', () => {
//     mainWindow?.show();
//     mainWindow?.focus();
//   });
// }

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
    showReminderPopup(_reminder);
  });
  const state = readState();
  // Ensure autostart matches persisted setting (portable)
  setAutostartEnabled(!!state.settings.runOnStartup, { startMinimized: !!state.settings.startMinimized }).catch(() => {});

  registerIpc({
    scheduler,
    onSettingsChanged: (s) => {
      setAutostartEnabled(!!s.runOnStartup, { startMinimized: !!s.startMinimized }).catch(() => {});
    },
  });

  createMainWindow();
  createTray();

  scheduler.rescheduleAll(state.reminders, state.settings.masterEnabled);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  // keep running (tray) on Windows
});
console.log("PRELOAD PATH:", path.join(__dirname, 'preload.js'));
console.log("EXISTS:", fs.existsSync(path.join(__dirname, 'preload.js')));
// Placeholder: popup + scheduler will be added next.

