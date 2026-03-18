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
// ── Path mới (ổn định) ──────────────────────────────────────────────────────
function getDataDir() {
    const dir = node_path_1.default.join(electron_1.app.getPath('userData'), 'data');
    node_fs_1.default.mkdirSync(dir, { recursive: true });
    return dir;
}
function statePath() {
    return node_path_1.default.join(getDataDir(), 'state.json');
}
// ── Path cũ (portable — có thể ở nhiều nơi) ────────────────────────────────
function getLegacyPaths() {
    const candidates = [];
    // 1. Cạnh file exe (portable path cũ)
    try {
        const exeDir = node_path_1.default.dirname(electron_1.app.getPath('exe'));
        candidates.push(node_path_1.default.join(exeDir, 'data', 'state.json'));
    }
    catch { /* ignore */ }
    // 2. userData/data (trường hợp fallback của store cũ)
    // — đây cũng là path mới, nhưng kiểm tra để không bỏ sót
    try {
        candidates.push(node_path_1.default.join(electron_1.app.getPath('userData'), 'data', 'state.json'));
    }
    catch { /* ignore */ }
    return candidates;
}
// ── Migration: chạy 1 lần khi khởi động ────────────────────────────────────
let migrated = false;
function migrateIfNeeded() {
    if (migrated)
        return;
    migrated = true;
    const target = statePath();
    // Nếu file mới đã tồn tại và có data hợp lệ → không cần migrate
    if (node_fs_1.default.existsSync(target)) {
        try {
            const raw = node_fs_1.default.readFileSync(target, 'utf-8');
            const parsed = JSON.parse(raw);
            if (parsed?.version === 1 && Array.isArray(parsed.reminders)) {
                return; // data mới hợp lệ, bỏ qua migration
            }
        }
        catch { /* file corrupt → tiếp tục tìm legacy */ }
    }
    // Tìm file legacy có data hợp lệ
    for (const legacyPath of getLegacyPaths()) {
        if (legacyPath === target)
            continue; // bỏ qua nếu trùng path
        if (!node_fs_1.default.existsSync(legacyPath))
            continue;
        try {
            const raw = node_fs_1.default.readFileSync(legacyPath, 'utf-8');
            const parsed = JSON.parse(raw);
            // Chỉ migrate nếu có reminder hoặc settings tùy chỉnh
            if (parsed?.version !== 1)
                continue;
            const hasData = parsed.reminders?.length > 0
                || parsed.settings?.masterEnabled
                || parsed.settings?.runOnStartup;
            if (!hasData)
                continue;
            // Copy sang path mới
            node_fs_1.default.mkdirSync(node_path_1.default.dirname(target), { recursive: true });
            const tmp = target + '.tmp';
            node_fs_1.default.writeFileSync(tmp, JSON.stringify(parsed, null, 2), 'utf-8');
            node_fs_1.default.renameSync(tmp, target);
            console.log(`[store] Migrated data from ${legacyPath} → ${target}`);
            // Đổi tên file cũ thành .bak để tránh migrate lại lần sau
            try {
                node_fs_1.default.renameSync(legacyPath, legacyPath + '.bak');
            }
            catch { /* không critical nếu rename thất bại */ }
            return; // migrate xong, dừng
        }
        catch (err) {
            console.warn(`[store] Migration failed for ${legacyPath}:`, err);
        }
    }
}
// ── Core read/write ─────────────────────────────────────────────────────────
function readState() {
    migrateIfNeeded();
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
    // Atomic write: ghi .tmp rồi rename → tránh corrupt nếu app bị kill giữa chừng
    const tmp = p + '.tmp';
    node_fs_1.default.writeFileSync(tmp, JSON.stringify(next, null, 2), 'utf-8');
    node_fs_1.default.renameSync(tmp, p);
}
function upsertReminder(reminder) {
    const state = readState();
    const idx = state.reminders.findIndex((r) => r.id === reminder.id);
    const reminders = [...state.reminders];
    if (idx >= 0)
        reminders[idx] = reminder;
    else
        reminders.unshift(reminder);
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
