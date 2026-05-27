declare module '*.module.css' {
  const classes: Readonly<Record<string, string>>;
  export default classes;
}

import type { UpdateCheckResult } from '../shared/update';

export {};
declare global {
  interface Window {
    reminder: {
      ping: () => Promise<string>;
      getState: () => Promise<any>;
      getAppVersion: () => Promise<string>;
      startupMark: (label: string) => Promise<boolean>;
      checkForUpdates: () => Promise<UpdateCheckResult>;
      openDownloadUrl: (url: string) => Promise<boolean>;
      getAutostartStatus: () => Promise<{
        enabledForCurrentConfig: boolean;
        expectedArgs: string[];
        launchItemEnabled: boolean;
      }>;
      resetAll: () => Promise<any>;
      clearCache: () => Promise<boolean>;
      setSettings: (partial: any) => Promise<any>;
      upsertReminder: (reminder: any) => Promise<any>;
      deleteReminder: (id: string) => Promise<any>;
      previewPopup: (cfg: any) => Promise<any>;
      minimizeWindow: () => Promise<any>;
      closeWindow: () => Promise<any>;
      quitApp: () => Promise<any>;
      onStateChanged: (cb: () => void) => () => void;
    };
  }
}