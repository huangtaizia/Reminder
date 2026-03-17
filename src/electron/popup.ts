import { BrowserWindow, screen, globalShortcut, app } from "electron"
import path from "node:path"
import type { Reminder } from "../shared/types"

type PopupWindow = {
  win: BrowserWindow
  reminderId: string
}

let popups: PopupWindow[] = []

/* ------------------------------------------------ */
/* UTILS */
/* ------------------------------------------------ */

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

/* ------------------------------------------------ */
/* TEXT WRAP */
/* ------------------------------------------------ */

function wrapToTwoLines(message: string): {
  line1: string
  line2?: string
  truncated: boolean
} {

  const text = message.replace(/\s+/g, " ").trim()

  if (!text)
    return { line1: "", truncated: false }

  const maxChars = 26

  if (text.length <= maxChars)
    return { line1: text, truncated: false }

  const cutAtSpace = (s: string, idx: number) => {
    const sub = s.slice(0, idx)
    const lastSpace = sub.lastIndexOf(" ")
    return lastSpace > 0 ? lastSpace : idx
  }

  const i1 = cutAtSpace(text, maxChars + 1)
  const line1 = text.slice(0, i1).trim()

  const rest = text.slice(i1).trim()

  if (rest.length <= maxChars)
    return { line1, line2: rest, truncated: false }

  const i2 = cutAtSpace(rest, maxChars + 1)

  const line2 = rest.slice(0, i2).trim()

  const truncated = rest.slice(i2).trim().length > 0

  return { line1, line2, truncated }
}

/* ------------------------------------------------ */
/* CLOSE POPUPS */
/* ------------------------------------------------ */

function closeReminder(reminderId: string) {

  popups
    .filter(p => p.reminderId === reminderId)
    .forEach(p => {
      if (!p.win.isDestroyed())
        p.win.close()
    })

  popups = popups.filter(p => p.reminderId !== reminderId)
}

/* ------------------------------------------------ */
/* CREATE POPUP */
/* ------------------------------------------------ */

export function showReminderPopup(reminder: Reminder) {

  const primary = screen.getPrimaryDisplay()
  const { width, height } = primary.bounds

  const win = new BrowserWindow({

    width,
    height,

    x: primary.bounds.x,
    y: primary.bounds.y,

    frame: false,
    transparent: true,

    resizable: false,
    movable: false,

    alwaysOnTop: true,
    skipTaskbar: true,

    focusable: true,
    show: false,

    webPreferences: {
      contextIsolation: true
    }

  })

  /* Always on top nhưng không freeze */

  win.setAlwaysOnTop(true, "pop-up-menu")

  /* Hiển thị trên mọi workspace */

  win.setVisibleOnAllWorkspaces(true)

  /* ESC global */

  const escShortcut = "Escape"

  if (!globalShortcut.isRegistered(escShortcut)) {
    globalShortcut.register(escShortcut, () => {
      if (!win.isDestroyed())
        win.close()
    })
  }

  win.on("closed", () => {

    if (globalShortcut.isRegistered(escShortcut))
      globalShortcut.unregister(escShortcut)

  })

  /* Load popup.html */

  // const popupPath = path.join(process.resourcesPath, "popup.html")
  const popupPath = app.isPackaged
    ? path.join(process.resourcesPath, "popup.html")
    : path.join(process.cwd(), "public", "popup.html")

console.log("Popup path:", popupPath)
  win.loadFile(popupPath, {

    query: {
      cfg: JSON.stringify({

        color: reminder.config.color,
        icon: reminder.config.icon,

        ...wrapToTwoLines(reminder.config.message),

        displayMs: clamp(
          reminder.config.displayMs,
          60_000,
          24 * 60 * 60_000
        ),

        startAt: Date.now()

      })
    }

  })

  /* Show khi ready */

  win.once("ready-to-show", () => {

    if (!win.isDestroyed()) {
      win.show()
      win.focus()
    }

  })

  popups.push({
    win,
    reminderId: reminder.id
  })

  return win
}