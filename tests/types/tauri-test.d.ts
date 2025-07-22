// Типы для тестирования Tauri приложений
// Расширение глобальных типов для E2E тестов

import '@tauri-apps/api';

declare global {
  interface Window {
    __TAURI__: {
      event: any;
      window: any;
      path: any;
      fs: any;
      shell: any;
      dialog: any;
      notification: any;
      http: any;
      clipboard: any;
      globalShortcut: any;
      process: any;
      os: any;
      updater: any;
      app: any;
      invoke: (cmd: string, args?: any) => Promise<any>;
    };
  }
}

// Типы для Playwright тестов с Tauri
export interface TauriTestContext {
  tauriProcess?: any;
  tauriPid?: string;
}

export {};