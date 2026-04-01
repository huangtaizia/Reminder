import { BrowserWindow, screen, app } from "electron"
import path from "node:path"
import type { Reminder } from "../shared/types"

type PopupEntry = {
  mainWin: BrowserWindow
  reminderId: string
}

// Stack toàn cục — popup mới nhất ở cuối
let popups: PopupEntry[] = []

// Shared dim overlay (tạo 1 lần, dùng chung cho toàn bộ stack) — chỉ màn hình chính
let dimWins: BrowserWindow[] = []

// Fullscreen click-capture trên màn hình phụ (không dim, chỉ chặn click ra app khác)
let blockerWins: BrowserWindow[] = []

let focusGuardsEnabled = false
let previewQueue: Promise<void> = Promise.resolve()
let focusReclaimSeq = 0
let sustainedReclaimTimer: NodeJS.Timeout | null = null

// Store window ids we forced ignore mouse while popup stack active.
const ignoredMouseWinIds = new Set<number>()



function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

// Kiểm tra window có thuộc bất kỳ popup nào không
function isAnyPopupWindow(w: BrowserWindow): boolean {
  return popups.some(p => p.mainWin === w) || dimWins.includes(w) || blockerWins.includes(w)
}

// Popup active nhất (trên cùng stack) — là popup cần giữ focus
function topPopup(): PopupEntry | null {
  return popups.length > 0 ? popups[popups.length - 1] : null
}

export function isReminderPopupActive(): boolean {
  return popups.length > 0
}

function syncMouseIgnore() {
  if (popups.length === 0) {
    for (const id of ignoredMouseWinIds) {
      const w = BrowserWindow.fromId(id)
      if (w && !w.isDestroyed()) w.setIgnoreMouseEvents(false)
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
  dimWin.setAlwaysOnTop(true, "screen-saver", 1)
  dimWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

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
    win.setAlwaysOnTop(true, "screen-saver", 1)
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
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

function stopSustainedReclaim() {
  if (sustainedReclaimTimer) {
    clearInterval(sustainedReclaimTimer)
    sustainedReclaimTimer = null
  }
}

function reclaimTopNow() {
  const top = topPopup()
  if (!top || top.mainWin.isDestroyed()) return
  top.mainWin.setAlwaysOnTop(true, "screen-saver", 100)
  top.mainWin.moveTop()
  if (!top.mainWin.isVisible()) top.mainWin.show()
  top.mainWin.focus()
  top.mainWin.webContents.focus()
}

function startSustainedReclaim(durationMs = 4000, intervalMs = 180) {
  stopSustainedReclaim()
  const startedAt = Date.now()
  sustainedReclaimTimer = setInterval(() => {
    if (popups.length === 0 || (Date.now() - startedAt) > durationMs) {
      stopSustainedReclaim()
      return
    }
    reclaimTopNow()
  }, intervalMs)
}

function queueTopFocusReclaim(delays = [0, 80, 180]) {
  const top = topPopup()
  if (!top || top.mainWin.isDestroyed()) return
  const reclaimSeq = ++focusReclaimSeq

  for (const delay of delays) {
    setTimeout(() => {
      if (reclaimSeq !== focusReclaimSeq) return
      const currentTop = topPopup()
      if (!currentTop || currentTop.mainWin !== top.mainWin || top.mainWin.isDestroyed()) return

      reclaimTopNow()
    }, delay)
  }
}

function onBrowserWindowFocus(_e: Electron.Event, focusedWin: BrowserWindow) {
  const top = topPopup()
  if (!top || top.mainWin.isDestroyed()) return
  if (focusedWin === top.mainWin || isAnyPopupWindow(focusedWin)) return
  queueTopFocusReclaim([30, 110, 220])
}

function onAppActivate() {
  queueTopFocusReclaim([0, 60, 150])
  startSustainedReclaim(2200, 170)
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
  stopSustainedReclaim()
  app.removeListener("browser-window-focus", onBrowserWindowFocus)
  app.removeListener("activate", onAppActivate)
}

function isTopWindow(win: BrowserWindow) {
  return topPopup()?.mainWin === win
}

export function showReminderPopup(reminder: Reminder) {
  // Keep stacking even when multiple reminders trigger close to each other.
  const instanceId = reminder.id
  const primary = screen.getPrimaryDisplay()
  const { bounds } = primary

  const popupPath = app.isPackaged
    ? path.join(process.resourcesPath, "popup.html")
    : path.join(process.cwd(), "public", "popup.html")

  const offset = popups.length * 24

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
    }
  })

  mainWin.setAlwaysOnTop(true, "screen-saver", 100)
  mainWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

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
    if (topPopup()?.mainWin !== mainWin) return

    // Reclaim theo nhịp vừa phải để tránh nhấp nháy khi hệ thống UI tạm giữ focus.
    queueTopFocusReclaim([90, 180, 320])
    startSustainedReclaim(4200, 160)
  })

  // ✅ FIX CLOSED (đúng syntax)
  mainWin.on("closed", () => {
    popups = popups.filter(p => p.mainWin !== mainWin)

    syncMouseIgnore()

    if (popups.length === 0) {
      destroyDimWins()
      destroyBlockerWins()
      stopFocusGuards()
      return
    }

    const newTop = topPopup()
    if (newTop && !newTop.mainWin.isDestroyed()) {
      newTop.mainWin.moveTop()
      newTop.mainWin.focus()
      newTop.mainWin.webContents.focus()
    }
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
    startSustainedReclaim(2200, 170)
  })

  const wasEmpty = popups.length === 0
  if (wasEmpty) {
    ensureDimWins()
    ensureBlockerWins()
  }

  popups.push({ mainWin, reminderId: instanceId })
  syncMouseIgnore()
  if (wasEmpty) startFocusGuards()

  return mainWin
}

function waitForClosed(win: BrowserWindow): Promise<void> {
  if (win.isDestroyed()) return Promise.resolve()
  return new Promise((resolve) => {
    win.once("closed", resolve)
    win.close()
  })
}

async function previewReminderInternal(reminder: Reminder) {
  const closing = popups.map(p => waitForClosed(p.mainWin))
  await Promise.allSettled(closing)

  popups = []
  syncMouseIgnore()
  destroyDimWins()
  destroyBlockerWins()
  stopFocusGuards()

  showReminderPopup(reminder)
}

export function previewReminder(reminder: Reminder) {
  previewQueue = previewQueue
    .catch(() => undefined)
    .then(() => previewReminderInternal(reminder))
  return previewQueue
}