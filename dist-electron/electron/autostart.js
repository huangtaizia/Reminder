"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAutostartStatus = getAutostartStatus;
exports.setAutostartEnabled = setAutostartEnabled;
exports.hasArg = hasArg;
exports.getExeName = getExeName;
const node_child_process_1 = require("node:child_process");
const node_path_1 = __importDefault(require("node:path"));
const electron_1 = require("electron");
const RUN_KEY = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';
const VALUE_NAME = 'Reminder';
function execReg(args) {
    return new Promise((resolve) => {
        (0, node_child_process_1.execFile)('reg.exe', args, { windowsHide: true }, (error, stdout, stderr) => {
            const code = error?.code ?? 0;
            resolve({ code, stdout: String(stdout ?? ''), stderr: String(stderr ?? '') });
        });
    });
}
function quoteExe(p) {
    // registry command value needs quotes if path contains spaces
    return `"${p}"`;
}
async function getAutostartStatus() {
    if (process.platform !== 'win32')
        return { enabled: false };
    const r = await execReg(['query', RUN_KEY, '/v', VALUE_NAME]);
    if (r.code !== 0)
        return { enabled: false };
    const raw = r.stdout;
    // crude parse: check presence of value name line
    const enabled = raw.toLowerCase().includes(VALUE_NAME.toLowerCase());
    return { enabled, rawValue: raw };
}
async function setAutostartEnabled(enabled, opts) {
    if (process.platform !== 'win32')
        return;
    if (!enabled) {
        await execReg(['delete', RUN_KEY, '/v', VALUE_NAME, '/f']);
        return;
    }
    const exePath = electron_1.app.getPath('exe');
    const args = ['--autostart'];
    if (opts.startMinimized)
        args.push('--minimized');
    const cmd = `${quoteExe(exePath)} ${args.join(' ')}`.trim();
    await execReg(['add', RUN_KEY, '/v', VALUE_NAME, '/t', 'REG_SZ', '/d', cmd, '/f']);
}
function hasArg(name) {
    const n = name.toLowerCase();
    return process.argv.some((a) => a.toLowerCase() === n);
}
function getExeName() {
    return node_path_1.default.basename(electron_1.app.getPath('exe'));
}
