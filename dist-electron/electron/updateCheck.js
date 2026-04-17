"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareSemver = compareSemver;
exports.resolveUpdateManifestUrl = resolveUpdateManifestUrl;
exports.checkForUpdates = checkForUpdates;
const electron_1 = require("electron");
const updateConfig_1 = require("./updateConfig");
function parseSemver(s) {
    const m = s.trim().match(/^(\d+)\.(\d+)\.(\d+)/);
    if (!m)
        return [0, 0, 0];
    return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)];
}
/** Dương nếu a > b */
function compareSemver(a, b) {
    const pa = parseSemver(a);
    const pb = parseSemver(b);
    for (let i = 0; i < 3; i++) {
        if (pa[i] !== pb[i])
            return pa[i] - pb[i];
    }
    return 0;
}
function resolveUpdateManifestUrl() {
    const builtin = (updateConfig_1.BUILTIN_UPDATE_MANIFEST_URL ?? '').trim();
    if (builtin)
        return builtin;
    return (process.env.REMINDER_UPDATE_MANIFEST_URL ?? '').trim();
}
async function checkForUpdates() {
    const currentVersion = electron_1.app.getVersion();
    const url = resolveUpdateManifestUrl();
    if (!url) {
        return {
            status: 'error',
            currentVersion,
            error: 'Chưa cấu hình máy chủ cập nhật trong bản build. Liên hệ quản trị hoặc bộ phận phát hành.',
            notConfigured: true,
        };
    }
    try {
        const res = await fetch(url, {
            headers: { Accept: 'application/json' },
            signal: AbortSignal.timeout(25_000),
        });
        if (!res.ok)
            throw new Error(`HTTP ${res.status}`);
        const manifest = (await res.json());
        if (!manifest?.version || typeof manifest.version !== 'string') {
            throw new Error('Manifest thiếu trường version');
        }
        const latestVersion = manifest.version.trim();
        if (compareSemver(latestVersion, currentVersion) <= 0) {
            return { status: 'latest', currentVersion, latestVersion };
        }
        return { status: 'available', currentVersion, latestVersion, manifest };
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return { status: 'error', currentVersion, error: msg };
    }
}
