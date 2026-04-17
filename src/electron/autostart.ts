import { app } from 'electron';
import path from 'node:path';

export type AutostartHealth = {
  enabledForCurrentConfig: boolean;
  expectedArgs: string[];
  launchItemEnabled: boolean;
};

export async function setAutostartEnabled(enabled: boolean, opts: { startMinimized: boolean }) {
  if (process.platform !== 'win32') return;
  const args = ['--autostart'];
  if (opts.startMinimized) args.push('--minimized');

  app.setLoginItemSettings({
    openAtLogin: enabled,
    openAsHidden: false,
    path: app.getPath('exe'),
    args,
  });

  const status = app.getLoginItemSettings({
    path: app.getPath('exe'),
    args,
  });

  if (status.openAtLogin !== enabled) {
    throw new Error(`Failed to update startup setting. Expected=${enabled}, actual=${status.openAtLogin}`);
  }
}

export function getAutostartHealth(opts: { startMinimized: boolean }): AutostartHealth {
  if (process.platform !== 'win32') {
    return {
      enabledForCurrentConfig: false,
      expectedArgs: ['--autostart'],
      launchItemEnabled: false,
    };
  }

  const expectedArgs = ['--autostart'];
  if (opts.startMinimized) expectedArgs.push('--minimized');

  const status = app.getLoginItemSettings({
    path: app.getPath('exe'),
    args: expectedArgs,
  });

  return {
    enabledForCurrentConfig: !!status.openAtLogin,
    expectedArgs,
    launchItemEnabled: !!status.openAtLogin,
  };
}

export function hasArg(name: string): boolean {
  const n = name.toLowerCase();
  return process.argv.some((a) => a.toLowerCase() === n);
}

export function getExeName(): string {
  return path.basename(app.getPath('exe'));
}

