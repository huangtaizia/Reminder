import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('reminder', {
  ping: async () => ipcRenderer.invoke('reminder:ping'),
  getState: async () => ipcRenderer.invoke('state:get'),
  resetAll: async () => ipcRenderer.invoke('state:resetAll'),
  setSettings: async (partial: any) => ipcRenderer.invoke('settings:set', partial),
  upsertReminder: async (reminder: any) => ipcRenderer.invoke('reminder:upsert', reminder),
  deleteReminder: async (id: string) => ipcRenderer.invoke('reminder:delete', id),
  previewPopup: async (cfg: any) => ipcRenderer.invoke('popup:preview', cfg),
  minimizeWindow: async () => ipcRenderer.invoke('window:minimize'),
  closeWindow: async () => ipcRenderer.invoke('window:close'),
});
