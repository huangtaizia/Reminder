"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readState = readState;
exports.writeState = writeState;
exports.upsertReminder = upsertReminder;
exports.deleteReminder = deleteReminder;
exports.setSettings = setSettings;
const electron_1 = require("electron");
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const DEFAULT_SETTINGS = {
    darkMode: true,
    runOnStartup: false,
    startMinimized: false,
    masterEnabled: false,
};
function getPortableRoot() {
    return node_path_1.default.dirname(electron_1.app.getPath('exe'));
}
function ensureWritableDir() {
    // In dev, app.getPath("exe") points to Electron inside node_modules (often not writable).
    // Use userData for dev; use portable folder for packaged builds.
    const preferred = electron_1.app.isPackaged ? node_path_1.default.join(getPortableRoot(), 'data') : node_path_1.default.join(electron_1.app.getPath('userData'), 'data');
    try {
        node_fs_1.default.mkdirSync(preferred, { recursive: true });
        node_fs_1.default.accessSync(preferred, node_fs_1.default.constants.W_OK);
        return preferred;
    }
    catch {
        const fallback = node_path_1.default.join(electron_1.app.getPath('userData'), 'data');
        node_fs_1.default.mkdirSync(fallback, { recursive: true });
        return fallback;
    }
}
function statePath() {
    return node_path_1.default.join(ensureWritableDir(), 'state.json');
}
function readState() {
    const p = statePath();
    try {
        const raw = node_fs_1.default.readFileSync(p, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed?.version !== 1)
            throw new Error('unsupported version');
        return parsed;
    }
    catch {
        return {
            version: 1,
            settings: DEFAULT_SETTINGS,
            reminders: [],
        };
    }
}
function writeState(next) {
    const p = statePath();
    node_fs_1.default.writeFileSync(p, JSON.stringify(next, null, 2), 'utf-8');
}
function upsertReminder(reminder) {
    const state = readState();
    const idx = state.reminders.findIndex((r) => r.id === reminder.id);
    const reminders = [...state.reminders];
    if (idx >= 0)
        reminders[idx] = reminder;
    else
        reminders.unshift(reminder); // newest first
    const next = { ...state, reminders };
    writeState(next);
    return next;
}
function deleteReminder(id) {
    const state = readState();
    const next = { ...state, reminders: state.reminders.filter((r) => r.id !== id) };
    writeState(next);
    return next;
}
function setSettings(partial) {
    const state = readState();
    const next = { ...state, settings: { ...state.settings, ...partial } };
    writeState(next);
    return next;
}
