"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('reminder', {
    ping: async () => electron_1.ipcRenderer.invoke('reminder:ping'),
    getState: async () => electron_1.ipcRenderer.invoke('state:get'),
    resetAll: async () => electron_1.ipcRenderer.invoke('state:resetAll'),
    setSettings: async (partial) => electron_1.ipcRenderer.invoke('settings:set', partial),
    upsertReminder: async (reminder) => electron_1.ipcRenderer.invoke('reminder:upsert', reminder),
    deleteReminder: async (id) => electron_1.ipcRenderer.invoke('reminder:delete', id),
    previewPopup: async (cfg) => electron_1.ipcRenderer.invoke('popup:preview', cfg),
    minimizeWindow: async () => electron_1.ipcRenderer.invoke('window:minimize'),
    closeWindow: async () => electron_1.ipcRenderer.invoke('window:close'),
    quitApp: async () => electron_1.ipcRenderer.invoke('quit-app'),
});
