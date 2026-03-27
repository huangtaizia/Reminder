import { BrowserWindow, screen, app } from "electron"
import path from "node:path"
import type { Reminder } from "../shared/types"

type PopupEntry = {
  mainWin: BrowserWindow
  blockWins: BrowserWindow[]
  reminderId: string
}
let popups: PopupEntry[] = []

type WindowEnableState = {
  win: BrowserWindow
  wasEnabled: boolean
}

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

  // Handle Esc at main-process layer for better reliability on Windows.
  win.webContents.on("before-input-event", (_event, input) => {
    if ((input.key === "Escape" || input.code === "Escape") && input.type === "keyDown") {
      onEsc()
    }
  })

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
  mainWin.setAlwaysOnTop(true, "screen-saver", process.platform === "win32" ? 2 : 1)

  const reclaimMainFocus = () => {
    if (mainWin.isDestroyed()) return
    mainWin.moveTop()
    if (process.platform === "win32") app.focus()
    mainWin.focus()
    mainWin.webContents.focus()
  }

  const refocusMain = () => {
    reclaimMainFocus()
    // Windows 10 can occasionally deny immediate focus steal.
    // Retry shortly to tighten focus lock after rapid user interactions.
    setTimeout(reclaimMainFocus, 30)
    setTimeout(reclaimMainFocus, 120)
  }

  const closeAll = () => {
    if (!mainWin.isDestroyed()) mainWin.close()
  }

  // ── Blocker windows trên màn hình phụ ──
  const blockWins = allDisplays
    .filter(d => d.id !== primary.id)
    .map(d => createBlockerWindow(d.bounds, closeAll, refocusMain))

  const isPopupWindow = (w: BrowserWindow) => w === mainWin || blockWins.includes(w)

  // While popup is active, disable all non-popup app windows
  // so click cannot move interaction away from reminder flow.
  const disabledWindows: WindowEnableState[] = []
  let nonPopupWindowsLocked = false
  const disableNonPopupWindows = () => {
    if (nonPopupWindowsLocked) return
    nonPopupWindowsLocked = true
    for (const w of BrowserWindow.getAllWindows()) {
      if (w.isDestroyed() || isPopupWindow(w)) continue
      const wasEnabled = w.isEnabled()
      disabledWindows.push({ win: w, wasEnabled })
      if (wasEnabled) w.setEnabled(false)
    }
  }

  const restoreNonPopupWindows = () => {
    if (!nonPopupWindowsLocked) return
    for (const entry of disabledWindows) {
      if (entry.win.isDestroyed()) continue
      entry.win.setEnabled(entry.wasEnabled)
    }
    disabledWindows.length = 0
    nonPopupWindowsLocked = false
  }

  // Focus lock trên mainWin
  let focusInterval: ReturnType<typeof setInterval> | null = null
  const appFocusGuard = (_e: Electron.Event, focusedWin: BrowserWindow) => {
    if (mainWin.isDestroyed()) return
    if (!isPopupWindow(focusedWin)) refocusMain()
  }

  mainWin.on("blur", refocusMain)
  app.on("browser-window-focus", appFocusGuard)

  const startFocusLock = () => {
    if (focusInterval) return
    reclaimMainFocus()
    setTimeout(reclaimMainFocus, 10)
    setTimeout(reclaimMainFocus, 60)
    setTimeout(reclaimMainFocus, 180)
    setTimeout(reclaimMainFocus, 350)
    focusInterval = setInterval(() => {
      if (mainWin.isDestroyed()) {
        clearInterval(focusInterval!)
        return
      }
      if (!mainWin.isFocused()) reclaimMainFocus()
    }, 100)
  }

  // Cleanup khi mainWin đóng
  mainWin.on("closed", () => {
    mainWin.off("blur", refocusMain)
    app.off("browser-window-focus", appFocusGuard)
    if (focusInterval) { clearInterval(focusInterval); focusInterval = null }
    restoreNonPopupWindows()
    // Bỏ close listener trên blockWins trước khi đóng
    // để tránh loop closeAll → closed → closeAll
    blockWins.forEach(w => {
      w.removeAllListeners("close")
      if (!w.isDestroyed()) w.close()
    })
    popups = popups.filter(p => p.mainWin !== mainWin)
  })

  disableNonPopupWindows()

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
      // Show blocker windows ngay tại thời điểm mainWin được phép show,
      // tránh trường hợp click quá nhanh trước khi blocker sẵn sàng.
      blockWins.forEach(w => {
        if (!w.isDestroyed()) {
          w.show()
          w.moveTop()
        }
      })

      mainWin.show()
      startFocusLock()
    }
  })

  // Handle Esc at main-process layer in addition to renderer key listener.
  mainWin.webContents.on("before-input-event", (_event, input) => {
    if ((input.key === "Escape" || input.code === "Escape") && input.type === "keyDown") {
      closeAll()
    }
  })

  popups.push({ mainWin, blockWins, reminderId: reminder.id })
  return mainWin
}