"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAutostartEnabled = setAutostartEnabled;
exports.getAutostartHealth = getAutostartHealth;
exports.hasArg = hasArg;
exports.getExeName = getExeName;
const electron_1 = require("electron");
const node_path_1 = __importDefault(require("node:path"));
async function setAutostartEnabled(enabled, opts) {
    if (process.platform !== 'win32')
        return;
    const args = ['--autostart'];
    if (opts.startMinimized)
        args.push('--minimized');
    electron_1.app.setLoginItemSettings({
        openAtLogin: enabled,
        openAsHidden: false,
        path: electron_1.app.getPath('exe'),
        args,
    });
    const status = electron_1.app.getLoginItemSettings({
        path: electron_1.app.getPath('exe'),
        args,
    });
    if (status.openAtLogin !== enabled) {
        throw new Error(`Failed to update startup setting. Expected=${enabled}, actual=${status.openAtLogin}`);
    }
}
function getAutostartHealth(opts) {
    if (process.platform !== 'win32') {
        return {
            enabledForCurrentConfig: false,
            expectedArgs: ['--autostart'],
            launchItemEnabled: false,
        };
    }
    const expectedArgs = ['--autostart'];
    if (opts.startMinimized)
        expectedArgs.push('--minimized');
    const status = electron_1.app.getLoginItemSettings({
        path: electron_1.app.getPath('exe'),
        args: expectedArgs,
    });
    return {
        enabledForCurrentConfig: !!status.openAtLogin,
        expectedArgs,
        launchItemEnabled: !!status.openAtLogin,
    };
}
function hasArg(name) {
    const n = name.toLowerCase();
    return process.argv.some((a) => a.toLowerCase() === n);
}
function getExeName() {
    return node_path_1.default.basename(electron_1.app.getPath('exe'));
}
