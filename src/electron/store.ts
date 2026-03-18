import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import type { PersistedState, Reminder, AppSettings } from '../shared/types';

const DEFAULT_SETTINGS: AppSettings = {
  darkMode: true,
  runOnStartup: false,
  startMinimized: false,
  masterEnabled: false,
};

// ── Path mới (ổn định) ──────────────────────────────────────────────────────
function getDataDir(): string {
  const dir = path.join(app.getPath('userData'), 'data');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function statePath(): string {
  return path.join(getDataDir(), 'state.json');
}

// ── Path cũ (portable — có thể ở nhiều nơi) ────────────────────────────────
function getLegacyPaths(): string[] {
  const candidates: string[] = [];

  // 1. Cạnh file exe (portable path cũ)
  try {
    const exeDir = path.dirname(app.getPath('exe'));
    candidates.push(path.join(exeDir, 'data', 'state.json'));
  } catch { /* ignore */ }

  // 2. userData/data (trường hợp fallback của store cũ)
  // — đây cũng là path mới, nhưng kiểm tra để không bỏ sót
  try {
    candidates.push(path.join(app.getPath('userData'), 'data', 'state.json'));
  } catch { /* ignore */ }

  return candidates;
}

// ── Migration: chạy 1 lần khi khởi động ────────────────────────────────────
let migrated = false;

function migrateIfNeeded(): void {
  if (migrated) return;
  migrated = true;

  const target = statePath();

  // Nếu file mới đã tồn tại và có data hợp lệ → không cần migrate
  if (fs.existsSync(target)) {
    try {
      const raw = fs.readFileSync(target, 'utf-8');
      const parsed = JSON.parse(raw) as PersistedState;
      if (parsed?.version === 1 && Array.isArray(parsed.reminders)) {
        return; // data mới hợp lệ, bỏ qua migration
      }
    } catch { /* file corrupt → tiếp tục tìm legacy */ }
  }

  // Tìm file legacy có data hợp lệ
  for (const legacyPath of getLegacyPaths()) {
    if (legacyPath === target) continue; // bỏ qua nếu trùng path
    if (!fs.existsSync(legacyPath)) continue;

    try {
      const raw = fs.readFileSync(legacyPath, 'utf-8');
      const parsed = JSON.parse(raw) as PersistedState;

      // Chỉ migrate nếu có reminder hoặc settings tùy chỉnh
      if (parsed?.version !== 1) continue;
      const hasData = parsed.reminders?.length > 0
        || parsed.settings?.masterEnabled
        || parsed.settings?.runOnStartup;

      if (!hasData) continue;

      // Copy sang path mới
      fs.mkdirSync(path.dirname(target), { recursive: true });
      const tmp = target + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(parsed, null, 2), 'utf-8');
      fs.renameSync(tmp, target);

      console.log(`[store] Migrated data from ${legacyPath} → ${target}`);

      // Đổi tên file cũ thành .bak để tránh migrate lại lần sau
      try {
        fs.renameSync(legacyPath, legacyPath + '.bak');
      } catch { /* không critical nếu rename thất bại */ }

      return; // migrate xong, dừng
    } catch (err) {
      console.warn(`[store] Migration failed for ${legacyPath}:`, err);
    }
  }
}

// ── Core read/write ─────────────────────────────────────────────────────────
export function readState(): PersistedState {
  migrateIfNeeded();

  const p = statePath();
  try {
    const raw = fs.readFileSync(p, 'utf-8');
    const parsed = JSON.parse(raw) as PersistedState;
    if (parsed?.version !== 1) throw new Error('unsupported version');
    return parsed;
  } catch {
    return {
      version: 1,
      settings: DEFAULT_SETTINGS,
      reminders: [],
    };
  }
}

export function writeState(next: PersistedState) {
  const p = statePath();
  // Atomic write: ghi .tmp rồi rename → tránh corrupt nếu app bị kill giữa chừng
  const tmp = p + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(next, null, 2), 'utf-8');
  fs.renameSync(tmp, p);
}

export function upsertReminder(reminder: Reminder): PersistedState {
  const state = readState();
  const idx = state.reminders.findIndex((r) => r.id === reminder.id);
  const reminders = [...state.reminders];
  if (idx >= 0) reminders[idx] = reminder;
  else reminders.unshift(reminder);
  const next = { ...state, reminders };
  writeState(next);
  return next;
}

export function deleteReminder(id: string): PersistedState {
  const state = readState();
  const next = { ...state, reminders: state.reminders.filter((r) => r.id !== id) };
  writeState(next);
  return next;
}

export function setSettings(partial: Partial<PersistedState['settings']>): PersistedState {
  const state = readState();
  const next = { ...state, settings: { ...state.settings, ...partial } };
  writeState(next);
  return next;
}