import { app } from 'electron';
import type { UpdateCheckResult, UpdateManifest } from '../shared/update';
import { BUILTIN_UPDATE_MANIFEST_URL } from './updateConfig';

function parseSemver(s: string): [number, number, number] {
  const m = s.trim().match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!m) return [0, 0, 0];
  return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)];
}

/** Dương nếu a > b */
export function compareSemver(a: string, b: string): number {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  return 0;
}

export function resolveUpdateManifestUrl(): string {
  const builtin = (BUILTIN_UPDATE_MANIFEST_URL ?? '').trim();
  if (builtin) return builtin;
  return (process.env.REMINDER_UPDATE_MANIFEST_URL ?? '').trim();
}

export async function checkForUpdates(): Promise<UpdateCheckResult> {
  const currentVersion = app.getVersion();
  const url = resolveUpdateManifestUrl();
  if (!url) {
    return {
      status: 'error',
      currentVersion,
      error:
        'Chưa cấu hình máy chủ cập nhật trong bản build. Liên hệ quản trị hoặc bộ phận phát hành.',
      notConfigured: true,
    };
  }

  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(25_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const manifest = (await res.json()) as UpdateManifest;
    if (!manifest?.version || typeof manifest.version !== 'string') {
      throw new Error('Manifest thiếu trường version');
    }
    const latestVersion = manifest.version.trim();
    if (compareSemver(latestVersion, currentVersion) <= 0) {
      return { status: 'latest', currentVersion, latestVersion };
    }
    return { status: 'available', currentVersion, latestVersion, manifest };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { status: 'error', currentVersion, error: msg };
  }
}
