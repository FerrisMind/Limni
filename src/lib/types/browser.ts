export interface Tab {
  id: string;
  title: string;
  url: string;
  isActive: boolean;
  isLoading: boolean;
  favicon?: string;
  history: string[];
  historyIndex: number;
  webviewLabel?: string; // Метка нативного webview
  hasAudio?: boolean; // Есть ли звук на вкладке
  isAudioMuted?: boolean; // Заглушен ли звук
  hasError?: boolean; // Есть ли ошибка загрузки
  errorMessage?: string; // Сообщение об ошибке
}

export interface BrowserState {
  tabs: Tab[];
  activeTabId: string | null;
  showBookmarks: boolean;
  showHistory: boolean;
  showSettings: boolean;
  showExtensions: boolean;
  showDownloads: boolean;
  showMainMenu: boolean;
}

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  createdAt: Date;
}

export interface HistoryEntry {
  id: string;
  title: string;
  url: string;
  visitedAt: Date;
  visitCount: number;
}

export interface BrowserSettings {
  homepage: string;
  searchEngine: string;
  downloadPath: string;
  theme: 'light' | 'dark' | 'system';
  allowJavaScript: boolean;
  allowImages: boolean;
  allowCookies: boolean;
}

// Типы для webview команд
export interface WebviewCommands {
  createTabWebview: (tabId: string, url: string, title: string) => Promise<string>;
  showTabWebview: (tabId: string) => Promise<void>;
  hideAllWebviews: () => Promise<void>; // Новая команда для скрытия всех webview'ов
  closeTabWebview: (tabId: string) => Promise<void>;
  navigateWebview: (tabId: string, url: string) => Promise<void>;
  getWebviewInfo: () => Promise<string[]>; // Для отладки
}
