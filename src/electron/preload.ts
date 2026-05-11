import { contextBridge, ipcRenderer } from 'electron';
contextBridge.exposeInMainWorld('reminder', {
  ping: async () => ipcRenderer.invoke('reminder:ping'),
  getState: async () => ipcRenderer.invoke('state:get'),
  getAppVersion: async () => ipcRenderer.invoke('app:getVersion'),
  startupMark: async (label: string) => ipcRenderer.invoke('startup:mark', label),
  checkForUpdates: async () => ipcRenderer.invoke('update:check'),
  openDownloadUrl: async (url: string) => ipcRenderer.invoke('update:openDownload', url),
  getAutostartStatus: async () => ipcRenderer.invoke('autostart:status'),
  resetAll: async () => ipcRenderer.invoke('state:resetAll'),
  clearCache: async () => ipcRenderer.invoke('cache:clear'),
  setSettings: async (partial: any) => ipcRenderer.invoke('settings:set', partial),
  upsertReminder: async (reminder: any) => ipcRenderer.invoke('reminder:upsert', reminder),
  deleteReminder: async (id: string) => ipcRenderer.invoke('reminder:delete', id),
  previewPopup: async (cfg: any) => ipcRenderer.invoke('popup:preview', cfg),
  minimizeWindow: async () => ipcRenderer.invoke('window:minimize'),
  closeWindow: async () => ipcRenderer.invoke('window:close'),
  quitApp: async () => ipcRenderer.invoke('quit-app'),
  onStateChanged: (cb: () => void) => {
    const handler = () => cb();
    ipcRenderer.on('state:changed', handler);
    return () => ipcRenderer.removeListener('state:changed', handler);
  },
});