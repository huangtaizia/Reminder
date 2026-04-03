"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isReminderPopupActive = isReminderPopupActive;
exports.showReminderPopup = showReminderPopup;
exports.previewReminder = previewReminder;
const electron_1 = require("electron");
const node_path_1 = __importDefault(require("node:path"));
let activePopupWin = null;
let activeReminderId = null;
let popupQueue = [];
// Shared dim overlay (tạo 1 lần, dùng chung cho toàn bộ stack) — chỉ màn hình chính
let dimWins = [];
// Fullscreen click-capture trên màn hình phụ (không dim, chỉ chặn click ra app khác)
let blockerWins = [];
let focusGuardsEnabled = false;
let previewQueue = Promise.resolve();
let focusReclaimSeq = 0;
// Store window ids we forced ignore mouse while popup stack active.
const ignoredMouseWinIds = new Set();
function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}
function isAnyPopupWindow(w) {
    return w === activePopupWin || dimWins.includes(w) || blockerWins.includes(w);
}
function isReminderPopupActive() {
    return !!activePopupWin && !activePopupWin.isDestroyed();
}
function syncMouseIgnore() {
    if (!isReminderPopupActive()) {
        for (const id of ignoredMouseWinIds) {
            const w = electron_1.BrowserWindow.fromId(id);
            if (w && !w.isDestroyed())
                w.setIgnoreMouseEvents(false);
        }
        ignoredMouseWinIds.clear();
        return;
    }
    for (const w of electron_1.BrowserWindow.getAllWindows()) {
        if (w.isDestroyed() || isAnyPopupWindow(w))
            continue;
        if (ignoredMouseWinIds.has(w.id))
            continue;
        try {
            w.setIgnoreMouseEvents(true);
            ignoredMouseWinIds.add(w.id);
        }
        catch {
            // ignore
        }
    }
}
function ensureDimWins() {
    if (dimWins.length > 0)
        return;
    const bounds = electron_1.screen.getPrimaryDisplay().bounds;
    const dimWin = new electron_1.BrowserWindow({
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
    });
    dimWin.setIgnoreMouseEvents(false);
    dimWin.setAlwaysOnTop(true, "screen-saver");
    dimWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    const dimPath = electron_1.app.isPackaged
        ? node_path_1.default.join(process.resourcesPath, "popup-dim.html")
        : node_path_1.default.join(process.cwd(), "public", "popup-dim.html");
    dimWin.loadFile(dimPath);
    dimWin.once("ready-to-show", () => {
        if (!dimWin.isDestroyed())
            dimWin.showInactive();
    });
    dimWins.push(dimWin);
}
function destroyDimWins() {
    for (const w of dimWins) {
        if (!w.isDestroyed())
            w.close();
    }
    dimWins = [];
}
function ensureBlockerWins() {
    if (blockerWins.length > 0)
        return;
    const primary = electron_1.screen.getPrimaryDisplay();
    const blockerPath = electron_1.app.isPackaged
        ? node_path_1.default.join(process.resourcesPath, "popup-blocker.html")
        : node_path_1.default.join(process.cwd(), "public", "popup-blocker.html");
    for (const d of electron_1.screen.getAllDisplays()) {
        if (d.id === primary.id)
            continue;
        const b = d.bounds;
        const win = new electron_1.BrowserWindow({
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
        });
        win.setIgnoreMouseEvents(false);
        win.setAlwaysOnTop(true, "screen-saver");
        win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
        win.setFocusable(false);
        win.loadFile(blockerPath);
        win.once("ready-to-show", () => {
            if (!win.isDestroyed())
                win.showInactive();
        });
        blockerWins.push(win);
    }
}
function destroyBlockerWins() {
    for (const w of blockerWins) {
        if (!w.isDestroyed())
            w.close();
    }
    blockerWins = [];
}
function reclaimTopNow() {
    const win = activePopupWin;
    if (!win || win.isDestroyed())
        return;
    // AV-safe mode: avoid foreground-steal APIs and just maintain z-order inside app.
    win.setAlwaysOnTop(true, "screen-saver");
    win.moveTop();
    if (!win.isVisible())
        win.show();
    win.focus();
    win.webContents.focus();
}
function queueTopFocusReclaim(delays = [0, 80, 180]) {
    const win = activePopupWin;
    if (!win || win.isDestroyed())
        return;
    const reclaimSeq = ++focusReclaimSeq;
    for (const delay of delays) {
        setTimeout(() => {
            if (reclaimSeq !== focusReclaimSeq)
                return;
            if (!activePopupWin || activePopupWin !== win || win.isDestroyed())
                return;
            reclaimTopNow();
        }, delay);
    }
}
function onBrowserWindowFocus(_e, focusedWin) {
    const win = activePopupWin;
    if (!win || win.isDestroyed())
        return;
    if (focusedWin === win || isAnyPopupWindow(focusedWin))
        return;
    queueTopFocusReclaim([30, 110, 220]);
}
function onAppActivate() {
    queueTopFocusReclaim([0, 60, 150]);
}
function startFocusGuards() {
    if (focusGuardsEnabled)
        return;
    focusGuardsEnabled = true;
    electron_1.app.on("browser-window-focus", onBrowserWindowFocus);
    electron_1.app.on("activate", onAppActivate);
}
function stopFocusGuards() {
    if (!focusGuardsEnabled)
        return;
    focusGuardsEnabled = false;
    focusReclaimSeq++;
    electron_1.app.removeListener("browser-window-focus", onBrowserWindowFocus);
    electron_1.app.removeListener("activate", onAppActivate);
}
function isTopWindow(win) {
    return activePopupWin === win;
}
function maybeQueueFocusFallback(win) {
    // If focus fails (common with Teams foreground), keep popup in Alt-Tab near top.
    setTimeout(() => {
        if (win.isDestroyed())
            return;
        const focused = electron_1.BrowserWindow.getFocusedWindow();
        if (focused !== win) {
            win.showInactive();
            win.flashFrame(true);
        }
    }, 220);
}
function createPopupForReminder(reminder) {
    const wasEmpty = !isReminderPopupActive();
    const cursorPoint = electron_1.screen.getCursorScreenPoint();
    const targetDisplay = electron_1.screen.getDisplayNearestPoint(cursorPoint);
    const { bounds } = targetDisplay;
    const devIconPath = node_path_1.default.join(process.cwd(), "build", "icons", "win", "icon.ico");
    const packagedIconPath = node_path_1.default.join(process.resourcesPath, "icon.ico");
    const popupIconPath = electron_1.app.isPackaged ? packagedIconPath : devIconPath;
    const popupPath = electron_1.app.isPackaged
        ? node_path_1.default.join(process.resourcesPath, "popup.html")
        : node_path_1.default.join(process.cwd(), "public", "popup.html");
    const offset = 0;
    const mainWin = new electron_1.BrowserWindow({
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
    });
    mainWin.setAlwaysOnTop(true, "screen-saver");
    mainWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    activePopupWin = mainWin;
    activeReminderId = reminder.id;
    const closeThis = () => {
        if (!mainWin.isDestroyed())
            mainWin.close();
    };
    // // ✅ FIX BLUR (không loop)
    // mainWin.on("blur", () => {
    //   if (topPopup()?.mainWin === mainWin) {
    //     setTimeout(() => {
    //       if (!mainWin.isDestroyed()) mainWin.focus()
    //     }, 50)
    //   }
    // })
    mainWin.on("blur", () => {
        if (activePopupWin !== mainWin)
            return;
        // Short reclaim only; no infinite pulse in AV-safe mode.
        queueTopFocusReclaim([90, 180, 320]);
    });
    mainWin.on("closed", () => {
        if (activePopupWin === mainWin) {
            activePopupWin = null;
            activeReminderId = null;
        }
        syncMouseIgnore();
        if (popupQueue.length === 0) {
            destroyDimWins();
            destroyBlockerWins();
            stopFocusGuards();
            return;
        }
        const next = popupQueue.shift();
        if (next)
            createPopupForReminder(next.reminder);
    });
    // mainWin.webContents.on("before-input-event", (_e, input) => {
    //   if (input.key === "Escape") closeThis()
    // })
    mainWin.webContents.on("before-input-event", (_e, input) => {
        if ((input.key === "Escape" || input.code === "Escape") && input.type === "keyDown") {
            if (isTopWindow(mainWin)) {
                closeThis(); // ✅ chỉ đóng popup trên cùng
            }
        }
    });
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
    });
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
        if (mainWin.isDestroyed())
            return;
        mainWin.show();
        queueTopFocusReclaim([40, 120, 220]);
        maybeQueueFocusFallback(mainWin);
    });
    if (wasEmpty) {
        ensureDimWins();
        ensureBlockerWins();
        startFocusGuards();
    }
    syncMouseIgnore();
    return mainWin;
}
function showReminderPopup(reminder) {
    if (isReminderPopupActive()) {
        popupQueue.push({ reminder });
        return activePopupWin ?? undefined;
    }
    return createPopupForReminder(reminder);
}
function waitForClosed(win) {
    if (win.isDestroyed())
        return Promise.resolve();
    return new Promise((resolve) => {
        win.once("closed", resolve);
        win.close();
    });
}
async function previewReminderInternal(reminder) {
    if (activePopupWin && !activePopupWin.isDestroyed()) {
        await waitForClosed(activePopupWin);
    }
    popupQueue = [];
    activePopupWin = null;
    activeReminderId = null;
    syncMouseIgnore();
    destroyDimWins();
    destroyBlockerWins();
    stopFocusGuards();
    showReminderPopup(reminder);
}
function previewReminder(reminder) {
    previewQueue = previewQueue
        .catch(() => undefined)
        .then(() => previewReminderInternal(reminder));
    return previewQueue;
}
