import { BrowserWindow, screen, app } from "electron"
import path from "node:path"
import type { Reminder } from "../shared/types"

type PopupEntry = {
  mainWin: BrowserWindow
  blockWins: BrowserWindow[]
  reminderId: string
}
let popups: PopupEntry[] = []

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

// Tạo blocker window trên màn hình phụ
// - Block click (setIgnoreMouseEvents false)
// - focusable: true để nhận ESC
// - Khi focus → redirect về mainWin
// - Khi ESC → đóng mainWin
function createBlockerWindow(
  bounds: Electron.Rectangle,
  onEsc: () => void,
  refocusMain: () => void
): BrowserWindow {
  const win = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    skipTaskbar: true,
    focusable: true,
    show: false,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: false,
    }
  })

  win.setIgnoreMouseEvents(false)
  win.setAlwaysOnTop(true, "screen-saver", 1)
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  // Khi blocker được focus (user click sang màn hình phụ)
  // redirect ngay về mainWin
  win.on("focus", refocusMain)

  // Load HTML với ESC listener
  // Dùng ipc-renderer không khả dụng vì contextIsolation
  // Thay vào đó dùng window.close() — main process lắng nghe "close" event
  const html = `<!DOCTYPE html><html><head>
    <style>*{margin:0;padding:0}html,body{width:100%;height:100%;background:rgba(0,0,0,0.01);overflow:hidden}</style>
  </head><body>
    <script>
      window.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') window.close();
      });
    </script>
  </body></html>`

  win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html))

  // "close" event = user bấm ESC trên màn hình phụ → đóng toàn bộ
  win.on("close", onEsc)

  win.once("ready-to-show", () => {
    if (!win.isDestroyed()) win.show()
  })

  return win
}

export function showReminderPopup(reminder: Reminder) {
  const primary = screen.getPrimaryDisplay()
  const allDisplays = screen.getAllDisplays()
  const { bounds } = primary

  const popupPath = app.isPackaged
    ? path.join(process.resourcesPath, "popup.html")
    : path.join(process.cwd(), "public", "popup.html")

  // ── Popup chính trên màn hình primary ──
  const mainWin = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    skipTaskbar: true,
    focusable: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      enableBlinkFeatures: 'FontAccess',
    }
  })

  mainWin.setIgnoreMouseEvents(false)
  mainWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  mainWin.setAlwaysOnTop(true, "screen-saver", 1)

  const refocusMain = () => {
    if (!mainWin.isDestroyed()) mainWin.focus()
  }

  const closeAll = () => {
    if (!mainWin.isDestroyed()) mainWin.close()
  }

  // ── Blocker windows trên màn hình phụ ──
  const blockWins = allDisplays
    .filter(d => d.id !== primary.id)
    .map(d => createBlockerWindow(d.bounds, closeAll, refocusMain))

  // Focus lock trên mainWin
  let focusInterval: ReturnType<typeof setInterval> | null = null

  mainWin.on("blur", refocusMain)

  mainWin.once("show", () => {
    mainWin.focus()
    focusInterval = setInterval(() => {
      if (mainWin.isDestroyed()) {
        clearInterval(focusInterval!); return
      }
      if (!mainWin.isFocused()) mainWin.focus()
    }, 100)
  })

  // Cleanup khi mainWin đóng
  mainWin.on("closed", () => {
    mainWin.off("blur", refocusMain)
    if (focusInterval) { clearInterval(focusInterval); focusInterval = null }
    // Bỏ close listener trên blockWins trước khi đóng
    // để tránh loop closeAll → closed → closeAll
    blockWins.forEach(w => {
      w.removeAllListeners("close")
      if (!w.isDestroyed()) w.close()
    })
    popups = popups.filter(p => p.mainWin !== mainWin)
  })

  mainWin.loadFile(popupPath, {
    query: {
      cfg: JSON.stringify({
        color: reminder.config.color,
        icon: reminder.config.icon,
        message: reminder.config.message,
        displayMs: clamp(reminder.config.displayMs, 60_000, 24 * 60 * 60_000),
        startAt: Date.now()
      })
    }
  })

  mainWin.once("ready-to-show", () => {
    if (!mainWin.isDestroyed()) {
      mainWin.show()
      mainWin.focus()
    }
  })

  popups.push({ mainWin, blockWins, reminderId: reminder.id })
  return mainWin
}