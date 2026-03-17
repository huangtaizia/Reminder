import { execFile } from 'node:child_process';
import path from 'node:path';
import { app } from 'electron';

const RUN_KEY = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';
const VALUE_NAME = 'Reminder';

function execReg(args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    execFile('reg.exe', args, { windowsHide: true }, (error, stdout, stderr) => {
      const code = (error as any)?.code ?? 0;
      resolve({ code, stdout: String(stdout ?? ''), stderr: String(stderr ?? '') });
    });
  });
}

function quoteExe(p: string) {
  // registry command value needs quotes if path contains spaces
  return `"${p}"`;
}

export async function getAutostartStatus(): Promise<{ enabled: boolean; rawValue?: string }> {
  if (process.platform !== 'win32') return { enabled: false };
  const r = await execReg(['query', RUN_KEY, '/v', VALUE_NAME]);
  if (r.code !== 0) return { enabled: false };
  const raw = r.stdout;
  // crude parse: check presence of value name line
  const enabled = raw.toLowerCase().includes(VALUE_NAME.toLowerCase());
  return { enabled, rawValue: raw };
}

export async function setAutostartEnabled(enabled: boolean, opts: { startMinimized: boolean }) {
  if (process.platform !== 'win32') return;

  if (!enabled) {
    await execReg(['delete', RUN_KEY, '/v', VALUE_NAME, '/f']);
    return;
  }

  const exePath = app.getPath('exe');
  const args = ['--autostart'];
  if (opts.startMinimized) args.push('--minimized');

  const cmd = `${quoteExe(exePath)} ${args.join(' ')}`.trim();
  await execReg(['add', RUN_KEY, '/v', VALUE_NAME, '/t', 'REG_SZ', '/d', cmd, '/f']);
}

export function hasArg(name: string): boolean {
  const n = name.toLowerCase();
  return process.argv.some((a) => a.toLowerCase() === n);
}

export function getExeName(): string {
  return path.basename(app.getPath('exe'));
}

