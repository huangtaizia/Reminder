import { BrowserWindow, screen, app, globalShortcut } from "electron"
import path from "node:path"
import type { Reminder } from "../shared/types"

type PopupEntry = { reminder: Reminder }
let activePopupWin: BrowserWindow | null = null
let activeReminderId: string | null = null
let popupQueue: PopupEntry[] = []

// Shared dim overlay (tạo 1 lần, dùng chung cho toàn bộ stack) — chỉ màn hình chính
let dimWins: BrowserWindow[] = []

// Fullscreen click-capture trên màn hình phụ (không dim, chỉ chặn click ra app khác)
let blockerWins: BrowserWindow[] = []

let focusGuardsEnabled = false
let previewQueue: Promise<void> = Promise.resolve()
let focusReclaimSeq = 0
let escShortcutRegistered = false

const ENABLE_POPUP_GLOBAL_ESC = (process.env.REMINDER_POPUP_GLOBAL_ESC ?? "1") !== "0"
const ENABLE_POPUP_MOUSE_LOCK = (process.env.REMINDER_POPUP_MOUSE_LOCK ?? "0") === "1"

// Store window ids we forced ignore mouse while popup stack active.
const ignoredMouseWinIds = new Set<number>()



function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function isAnyPopupWindow(w: BrowserWindow): boolean {
  return w === activePopupWin || dimWins.includes(w) || blockerWins.includes(w)
}

export function isReminderPopupActive(): boolean {
  return !!activePopupWin && !activePopupWin.isDestroyed()
}

function syncMouseIgnore() {
  if (!ENABLE_POPUP_MOUSE_LOCK) {
    // Fail-safe: ensure no app window is left unclickable.
    for (const w of BrowserWindow.getAllWindows()) {
      if (w.isDestroyed() || isAnyPopupWindow(w)) continue
      try {
        w.setIgnoreMouseEvents(false)
      } catch {
        // ignore
      }
    }
    ignoredMouseWinIds.clear()
    return
  }

  if (!isReminderPopupActive()) {
    // Strong recovery path: reset all non-popup windows, not only tracked ids.
    for (const w of BrowserWindow.getAllWindows()) {
      if (w.isDestroyed() || isAnyPopupWindow(w)) continue
      try {
        w.setIgnoreMouseEvents(false)
      } catch {
        // ignore
      }
    }
    ignoredMouseWinIds.clear()
    return
  }

  for (const w of BrowserWindow.getAllWindows()) {
    if (w.isDestroyed() || isAnyPopupWindow(w)) continue
    if (ignoredMouseWinIds.has(w.id)) continue
    try {
      w.setIgnoreMouseEvents(true)
      ignoredMouseWinIds.add(w.id)
    } catch {
      // ignore
    }
  }
}

function ensureDimWins() {
  if (dimWins.length > 0) return
  const bounds = screen.getPrimaryDisplay().bounds
  const dimWin = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    skipTaskbar: true,
    focusable: false,
    show: false,
    webPreferences: { contextIsolation: false },
  })

  dimWin.setIgnoreMouseEvents(false)
  dimWin.setAlwaysOnTop(true, "floating")

  const dimPath = app.isPackaged
    ? path.join(process.resourcesPath, "popup-dim.html")
    : path.join(process.cwd(), "public", "popup-dim.html")
  dimWin.loadFile(dimPath)
  dimWin.once("ready-to-show", () => {
    if (!dimWin.isDestroyed()) dimWin.showInactive()
  })
  dimWins.push(dimWin)
}

function destroyDimWins() {
  for (const w of dimWins) {
    if (!w.isDestroyed()) w.close()
  }
  dimWins = []
}

function ensureBlockerWins() {
  if (blockerWins.length > 0) return
  const primary = screen.getPrimaryDisplay()
  const blockerPath = app.isPackaged
    ? path.join(process.resourcesPath, "popup-blocker.html")
    : path.join(process.cwd(), "public", "popup-blocker.html")

  for (const d of screen.getAllDisplays()) {
    if (d.id === primary.id) continue
    const b = d.bounds
    const win = new BrowserWindow({
      width: b.width,
      height: b.height,
      x: b.x,
      y: b.y,
      frame: false,
      transparent: true,
      resizable: false,
      movable: false,
      skipTaskbar: true,
      focusable: false,
      show: false,
      webPreferences: { contextIsolation: false },
    })
    win.setIgnoreMouseEvents(false)
    win.setAlwaysOnTop(true, "floating")
    win.setFocusable(false)
    win.loadFile(blockerPath)
    win.once("ready-to-show", () => {
      if (!win.isDestroyed()) win.showInactive()
    })
    blockerWins.push(win)
  }
}

function destroyBlockerWins() {
  for (const w of blockerWins) {
    if (!w.isDestroyed()) w.close()
  }
  blockerWins = []
}

function registerPopupEscShortcut() {
  if (!ENABLE_POPUP_GLOBAL_ESC || escShortcutRegistered) return
  try {
    escShortcutRegistered = globalShortcut.register("Esc", () => {
      const win = activePopupWin
      if (!win || win.isDestroyed()) return
      win.close()
    })
  } catch {
    escShortcutRegistered = false
  }
}

function unregisterPopupEscShortcut() {
  if (!escShortcutRegistered) return
  try {
    globalShortcut.unregister("Esc")
  } catch {
    // ignore
  } finally {
    escShortcutRegistered = false
  }
}

function reclaimTopNow() {
  const win = activePopupWin
  if (!win || win.isDestroyed()) return
  // AV-safe mode: avoid foreground-steal APIs and just maintain z-order inside app.
  win.setAlwaysOnTop(true, "pop-up-menu")
  win.moveTop()
  if (!win.isVisible()) win.show()
  win.focus()
  win.webContents.focus()
}

function queueTopFocusReclaim(delays = [0, 80, 180]) {
  const win = activePopupWin
  if (!win || win.isDestroyed()) return
  const reclaimSeq = ++focusReclaimSeq

  for (const delay of delays) {
    setTimeout(() => {
      if (reclaimSeq !== focusReclaimSeq) return
      if (!activePopupWin || activePopupWin !== win || win.isDestroyed()) return

      reclaimTopNow()
    }, delay)
  }
}

function onBrowserWindowFocus(_e: Electron.Event, focusedWin: BrowserWindow) {
  const win = activePopupWin
  if (!win || win.isDestroyed()) return
  if (focusedWin === win || isAnyPopupWindow(focusedWin)) return
  queueTopFocusReclaim([30, 110, 220])
}

function onAppActivate() {
  queueTopFocusReclaim([0, 60, 150])
}

function startFocusGuards() {
  if (focusGuardsEnabled) return
  focusGuardsEnabled = true
  app.on("browser-window-focus", onBrowserWindowFocus)
  app.on("activate", onAppActivate)
}

function stopFocusGuards() {
  if (!focusGuardsEnabled) return
  focusGuardsEnabled = false
  focusReclaimSeq++
  app.removeListener("browser-window-focus", onBrowserWindowFocus)
  app.removeListener("activate", onAppActivate)
}

function isTopWindow(win: BrowserWindow) {
  return activePopupWin === win
}

function maybeQueueFocusFallback(win: BrowserWindow) {
  // If focus fails (common with Teams foreground), keep popup in Alt-Tab near top.
  setTimeout(() => {
    if (win.isDestroyed()) return
    const focused = BrowserWindow.getFocusedWindow()
    if (focused !== win) {
      win.showInactive()
      win.flashFrame(true)
    }
  }, 220)
}

function createPopupForReminder(reminder: Reminder) {
  const wasEmpty = !isReminderPopupActive()
  const { bounds } = screen.getPrimaryDisplay()
  const devIconPath = path.join(process.cwd(), "build", "icons", "win", "icon.ico")
  const packagedIconPath = path.join(process.resourcesPath, "icon.ico")
  const popupIconPath = app.isPackaged ? packagedIconPath : devIconPath

  const popupPath = app.isPackaged
    ? path.join(process.resourcesPath, "popup.html")
    : path.join(process.cwd(), "public", "popup.html")

  const offset = 0

  const mainWin = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    // AV-safe + usability: allow Alt-Tab focus directly to popup.
    skipTaskbar: false,
    icon: popupIconPath,
    focusable: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
    }
  })

  mainWin.setAlwaysOnTop(true, "pop-up-menu")
  activePopupWin = mainWin
  activeReminderId = reminder.id

  const closeThis = () => {
    if (!mainWin.isDestroyed()) mainWin.close()
  }

  // // ✅ FIX BLUR (không loop)
  // mainWin.on("blur", () => {
  //   if (topPopup()?.mainWin === mainWin) {
  //     setTimeout(() => {
  //       if (!mainWin.isDestroyed()) mainWin.focus()
  //     }, 50)
  //   }
  // })
  mainWin.on("blur", () => {
    if (activePopupWin !== mainWin) return

    // Short reclaim only; no infinite pulse in AV-safe mode.
    queueTopFocusReclaim([90, 180, 320])
  })

  mainWin.on("closed", () => {
    if (activePopupWin === mainWin) {
      activePopupWin = null
      activeReminderId = null
    }
    syncMouseIgnore()

    if (popupQueue.length === 0) {
      destroyDimWins()
      destroyBlockerWins()
      stopFocusGuards()
      unregisterPopupEscShortcut()
      return
    }
    const next = popupQueue.shift()
    if (next) createPopupForReminder(next.reminder)
  })

  // mainWin.webContents.on("before-input-event", (_e, input) => {
  //   if (input.key === "Escape") closeThis()
  // })
  mainWin.webContents.on("before-input-event", (_e, input) => {
    if ((input.key === "Escape" || input.code === "Escape") && input.type === "keyDown") {
      if (isTopWindow(mainWin)) {
        closeThis() // ✅ chỉ đóng popup trên cùng
      }
    }
  })

  mainWin.loadFile(popupPath, {
    query: {
      cfg: JSON.stringify({
        icon: reminder.config.icon,
        color: reminder.config.color,
        message: reminder.config.message,
        displayMs: clamp(reminder.config.displayMs, 60000, 86400000),
        startAt: Date.now(),
        stackOffset: offset,
      })
    }
  })

  // mainWin.once("ready-to-show", () => {
  //   if (!mainWin.isDestroyed()) {
  //     mainWin.show()
  //     mainWin.focus()

  //     blockWins.forEach(w => {
  //       if (!w.isDestroyed()) w.showInactive()
  //     })
  //   }
  // })
  mainWin.once("ready-to-show", () => {
    if (mainWin.isDestroyed()) return
    mainWin.show()
    queueTopFocusReclaim([40, 120, 220])
    maybeQueueFocusFallback(mainWin)
  })

  if (wasEmpty) {
    ensureDimWins()
    ensureBlockerWins()
    startFocusGuards()
    registerPopupEscShortcut()
  }

  syncMouseIgnore()
  return mainWin
}

export function showReminderPopup(reminder: Reminder) {
  if (isReminderPopupActive()) {
    popupQueue.push({ reminder })
    return activePopupWin ?? undefined
  }
  return createPopupForReminder(reminder)
}

function waitForClosed(win: BrowserWindow): Promise<void> {
  if (win.isDestroyed()) return Promise.resolve()
  return new Promise((resolve) => {
    win.once("closed", resolve)
    win.close()
  })
}

async function previewReminderInternal(reminder: Reminder) {
  if (activePopupWin && !activePopupWin.isDestroyed()) {
    await waitForClosed(activePopupWin)
  }
  popupQueue = []
  activePopupWin = null
  activeReminderId = null
  syncMouseIgnore()
  destroyDimWins()
  destroyBlockerWins()
  stopFocusGuards()
  unregisterPopupEscShortcut()

  showReminderPopup(reminder)
}

export function previewReminder(reminder: Reminder) {
  previewQueue = previewQueue
    .catch(() => undefined)
    .then(() => previewReminderInternal(reminder))
  return previewQueue
}