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
function resolveGitHubRepo() {
    const envRepo = (process.env.REMINDER_GITHUB_REPO ?? '').trim();
    const builtinRepo = (updateConfig_1.BUILTIN_GITHUB_REPO ?? '').trim();
    return envRepo || builtinRepo;
}
function parseReleaseNotes(body) {
    if (!body?.trim())
        return [];
    return body
        .split('\n')
        .map((line) => line.trim())
        .map((line) => line.replace(/^[-*]\s+/, '').trim())
        .filter(Boolean)
        .slice(0, 20);
}
async function fetchManifestFromGitHub(repo) {
    const apiUrl = `https://api.github.com/repos/${repo}/releases/latest`;
    const res = await fetch(apiUrl, {
        headers: {
            Accept: 'application/vnd.github+json',
            'User-Agent': 'Reminder-App-Updater',
            'X-GitHub-Api-Version': '2022-11-28',
        },
        signal: AbortSignal.timeout(25_000),
    });
    if (!res.ok)
        throw new Error(`GitHub releases API HTTP ${res.status}`);
    const release = (await res.json());
    const version = (release.tag_name ?? '').trim().replace(/^v/i, '');
    if (!version)
        throw new Error('GitHub release thiếu tag_name');
    const assets = release.assets ?? [];
    const exeAsset = assets.find((a) => (a.name ?? '').match(/^Reminder-.*\.exe$/i))
        ?? assets.find((a) => (a.name ?? '').toLowerCase().endsWith('.exe'));
    const downloadUrl = exeAsset?.browser_download_url?.trim();
    return {
        version,
        notesLines: parseReleaseNotes(release.body),
        windows: downloadUrl ? { portableExe: { url: downloadUrl } } : undefined,
    };
}
async function checkForUpdates() {
    const currentVersion = electron_1.app.getVersion();
    const url = resolveUpdateManifestUrl();
    const githubRepo = resolveGitHubRepo();
    if (!url && !githubRepo) {
        return {
            status: 'error',
            currentVersion,
            error: 'Chưa cấu hình nguồn cập nhật (manifest URL hoặc GitHub repo) trong bản build.',
            notConfigured: true,
        };
    }
    try {
        const manifest = url
            ? await (async () => {
                const res = await fetch(url, {
                    headers: { Accept: 'application/json' },
                    signal: AbortSignal.timeout(25_000),
                });
                if (!res.ok)
                    throw new Error(`Manifest HTTP ${res.status}`);
                return (await res.json());
            })()
            : await fetchManifestFromGitHub(githubRepo);
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
