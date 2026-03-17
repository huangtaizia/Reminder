"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.showReminderPopup = showReminderPopup;
const electron_1 = require("electron");
const node_path_1 = __importDefault(require("node:path"));
let popups = [];
/* ------------------------------------------------ */
/* UTILS */
/* ------------------------------------------------ */
function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}
/* ------------------------------------------------ */
/* TEXT WRAP */
/* ------------------------------------------------ */
function wrapToTwoLines(message) {
    const text = message.replace(/\s+/g, " ").trim();
    if (!text)
        return { line1: "", truncated: false };
    const maxChars = 26;
    if (text.length <= maxChars)
        return { line1: text, truncated: false };
    const cutAtSpace = (s, idx) => {
        const sub = s.slice(0, idx);
        const lastSpace = sub.lastIndexOf(" ");
        return lastSpace > 0 ? lastSpace : idx;
    };
    const i1 = cutAtSpace(text, maxChars + 1);
    const line1 = text.slice(0, i1).trim();
    const rest = text.slice(i1).trim();
    if (rest.length <= maxChars)
        return { line1, line2: rest, truncated: false };
    const i2 = cutAtSpace(rest, maxChars + 1);
    const line2 = rest.slice(0, i2).trim();
    const truncated = rest.slice(i2).trim().length > 0;
    return { line1, line2, truncated };
}
/* ------------------------------------------------ */
/* CLOSE POPUPS */
/* ------------------------------------------------ */
function closeReminder(reminderId) {
    popups
        .filter(p => p.reminderId === reminderId)
        .forEach(p => {
        if (!p.win.isDestroyed())
            p.win.close();
    });
    popups = popups.filter(p => p.reminderId !== reminderId);
}
/* ------------------------------------------------ */
/* CREATE POPUP */
/* ------------------------------------------------ */
function showReminderPopup(reminder) {
    const primary = electron_1.screen.getPrimaryDisplay();
    const { width, height } = primary.bounds;
    const win = new electron_1.BrowserWindow({
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
    });
    /* Always on top nhưng không freeze */
    win.setAlwaysOnTop(true, "pop-up-menu");
    /* Hiển thị trên mọi workspace */
    win.setVisibleOnAllWorkspaces(true);
    /* ESC global */
    const escShortcut = "Escape";
    if (!electron_1.globalShortcut.isRegistered(escShortcut)) {
        electron_1.globalShortcut.register(escShortcut, () => {
            if (!win.isDestroyed())
                win.close();
        });
    }
    win.on("closed", () => {
        if (electron_1.globalShortcut.isRegistered(escShortcut))
            electron_1.globalShortcut.unregister(escShortcut);
    });
    /* Load popup.html */
    // const popupPath = path.join(process.resourcesPath, "popup.html")
    const popupPath = electron_1.app.isPackaged
        ? node_path_1.default.join(process.resourcesPath, "popup.html")
        : node_path_1.default.join(process.cwd(), "public", "popup.html");
    console.log("Popup path:", popupPath);
    win.loadFile(popupPath, {
        query: {
            cfg: JSON.stringify({
                color: reminder.config.color,
                icon: reminder.config.icon,
                ...wrapToTwoLines(reminder.config.message),
                displayMs: clamp(reminder.config.displayMs, 60_000, 24 * 60 * 60_000),
                startAt: Date.now()
            })
        }
    });
    /* Show khi ready */
    win.once("ready-to-show", () => {
        if (!win.isDestroyed()) {
            win.show();
            win.focus();
        }
    });
    popups.push({
        win,
        reminderId: reminder.id
    });
    return win;
}
