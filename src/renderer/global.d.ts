export {};
declare global {
  interface Window {
    reminder: {
      ping: () => Promise<string>;
      getState: () => Promise<any>;
      resetAll: () => Promise<any>;
      setSettings: (partial: any) => Promise<any>;
      upsertReminder: (reminder: any) => Promise<any>;
      deleteReminder: (id: string) => Promise<any>;
      previewPopup: (cfg: any) => Promise<any>;
      minimizeWindow: () => Promise<any>;
      closeWindow: () => Promise<any>;
      quitApp: () => Promise<any>;
    };
  }
}