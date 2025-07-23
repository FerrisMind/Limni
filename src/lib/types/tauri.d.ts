// Типы для Tauri API
// Расширение глобального объекта Window для поддержки __TAURI__

declare global {
  interface Window {
    __TAURI__?: {
      core?: {
        invoke: (...args: any[]) => Promise<any>;
      };
      event?: any;
      window?: any;
      path?: any;
      fs?: any;
      shell?: any;
      dialog?: any;
      notification?: any;
      http?: any;
      clipboard?: any;
      globalShortcut?: any;
      process?: any;
      os?: any;
      updater?: any;
      app?: any;
      webviewWindow?: any;
    };
  }
}

// Экспорт для использования в модулях
export {};