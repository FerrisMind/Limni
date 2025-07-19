import type { Tab, BrowserState, Bookmark, HistoryEntry, BrowserSettings } from '../types/browser.js';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

// Генерация уникального ID
function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// Создание нового таба
function createTab(url: string = 'about:blank', title: string = 'Новая вкладка'): Tab {
  return {
    id: generateId(),
    title,
    url,
    isActive: false,
    isLoading: false,
    history: [url],
    historyIndex: 0,
    webviewLabel: undefined,
    favicon: undefined // Убедимся, что favicon инициализируется как undefined
  };
}

// Основное состояние интернет-навигатора
export const browserState = $state<BrowserState>({
  tabs: [],
  activeTabId: null,
  showBookmarks: false,
  showHistory: false,
  showSettings: false,
  showExtensions: false,
  showDownloads: false,
  showMainMenu: false
});

// Глобальное состояние окна
export const windowState = $state({
  isMaximized: false
});

// Закладки
export const bookmarks = $state<Bookmark[]>([
  {
    id: generateId(),
    title: 'Google',
    url: 'https://www.google.com',
    createdAt: new Date()
  },
  {
    id: generateId(),
    title: 'GitHub',
    url: 'https://github.com',
    createdAt: new Date()
  }
]);

// История
export const history = $state<HistoryEntry[]>([]);

// Настройки
export const settings = $state<BrowserSettings>({
  homepage: 'https://www.google.com',
  searchEngine: 'google',
  downloadPath: '',
  theme: 'system',
  allowJavaScript: true,
  allowImages: true,
  allowCookies: true
});

// Функции для работы с вкладками
export async function addTab(url: string = 'about:blank', title: string = 'Новая вкладка'): Promise<void> {
  const newTab = createTab(url, title);
  browserState.tabs.push(newTab);

  try {
    // Создаем webview для новой вкладки, если это не about:blank
    if (url !== 'about:blank') {
      const webviewLabel = await invoke<string>('create_tab_webview', {
        tabId: newTab.id,
        url: url,
        title: title
      });
      
      newTab.webviewLabel = webviewLabel;
      newTab.isLoading = true;
      
      // Добавляем в историю
      addToHistory(title, url);

      // Загружаем фавикон для новой вкладки через бэкенд
      try {
        const faviconDataUrl = await invoke<string>('fetch_favicon_backend', { url: url });
        newTab.favicon = faviconDataUrl;
      } catch (error) {
        console.error(`Failed to fetch favicon for ${url} via backend:`, error);
        newTab.favicon = undefined; // Очищаем, если не удалось загрузить
      }
    }
    
    setActiveTab(newTab.id);
  } catch (error) {
    console.error('Ошибка создания webview:', error);
    // Если не удалось создать webview, оставляем вкладку как placeholder
  }
}

export async function closeTab(tabId: string): Promise<void> {
  const tabIndex = browserState.tabs.findIndex(tab => tab.id === tabId);
  if (tabIndex === -1) return;

  const tab = browserState.tabs[tabIndex];
  const isActive = tab.isActive;

  try {
    // Закрываем webview если он существует
    if (tab.webviewLabel) {
      await invoke('close_tab_webview', { tabId: tabId });
    }
  } catch (error) {
    console.error('Ошибка закрытия webview:', error);
  }

  browserState.tabs.splice(tabIndex, 1);

  if (browserState.tabs.length === 0) {
    addTab();
    return;
  }

  if (isActive) {
    const newActiveIndex = Math.min(tabIndex, browserState.tabs.length - 1);
    setActiveTab(browserState.tabs[newActiveIndex].id);
  }
}

export async function setActiveTab(tabId: string): Promise<void> {
  try {
    // Обновляем состояние вкладок
    browserState.tabs.forEach(tab => {
      tab.isActive = tab.id === tabId;
    });
    browserState.activeTabId = tabId;

    // Показываем соответствующий webview или скрываем все
    const activeTab = browserState.tabs.find(t => t.id === tabId);
    if (activeTab) {
      if (activeTab.webviewLabel && activeTab.url !== 'about:blank') {
        // Показываем webview для активной вкладки с URL
        await invoke('show_tab_webview', { tabId: tabId });
      } else {
        // Скрываем все webview'ы для about:blank или вкладок без webview
        await invoke('hide_all_webviews');
      }
    }
  } catch (error) {
    console.error('Ошибка переключения вкладки:', error);
  }
}

export async function updateTabUrl(tabId: string, url: string, title?: string): Promise<void> {
  const tab = browserState.tabs.find(t => t.id === tabId);
  if (!tab) return;

  try {
    tab.isLoading = true;

    // Если у вкладки еще нет webview, создаем его
    if (!tab.webviewLabel && url !== 'about:blank') {
      const webviewLabel = await invoke<string>('create_tab_webview', {
        tabId: tabId,
        url: url,
        title: title || tab.title
      });
      
      tab.webviewLabel = webviewLabel;
      
      // Если это активная вкладка, показываем webview
      if (tab.isActive) {
        await invoke('show_tab_webview', { tabId: tabId });
      }
    } else if (tab.webviewLabel && url !== 'about:blank') {
      // Навигируем существующий webview
      await invoke('navigate_webview', {
        tabId: tabId,
        url: url
      });
    }

    // Обновляем данные вкладки
    tab.url = url;
    if (title) tab.title = title;
    
    // Добавляем в историю вкладки
    if (tab.history[tab.historyIndex] !== url) {
      tab.history = tab.history.slice(0, tab.historyIndex + 1);
      tab.history.push(url);
      tab.historyIndex = tab.history.length - 1;
    }

    // Добавляем в общую историю
    if (url !== 'about:blank') {
      addToHistory(title || url, url);
      // Загружаем фавикон после навигации через бэкенд
      try {
        const faviconDataUrl = await invoke<string>('fetch_favicon_backend', { url: url });
        tab.favicon = faviconDataUrl;
      } catch (error) {
        console.error(`Failed to fetch favicon for ${url} via backend:`, error);
        tab.favicon = undefined; // Очищаем, если не удалось загрузить
      }
    }

    tab.isLoading = false;
  } catch (error) {
    console.error('Ошибка навигации:', error);
    tab.isLoading = false;
  }
}

export async function navigateBack(tabId: string): Promise<void> {
  const tab = browserState.tabs.find(t => t.id === tabId);
  if (!tab || tab.historyIndex <= 0) return;

  tab.historyIndex--;
  const url = tab.history[tab.historyIndex];
  
  try {
    if (tab.webviewLabel && url !== 'about:blank') {
      await invoke('navigate_webview', {
        tabId: tabId,
        url: url
      });
    }
    tab.url = url;
    // Загружаем фавикон при навигации назад через бэкенд
    try {
      const faviconDataUrl = await invoke<string>('fetch_favicon_backend', { url: url });
      tab.favicon = faviconDataUrl;
    } catch (error) {
      console.error(`Failed to fetch favicon for ${url} via backend:`, error);
      tab.favicon = undefined;
    }
  } catch (error) {
    console.error('Ошибка навигации назад:', error);
  }
}

export async function navigateForward(tabId: string): Promise<void> {
  const tab = browserState.tabs.find(t => t.id === tabId);
  if (!tab || tab.historyIndex >= tab.history.length - 1) return;

  tab.historyIndex++;
  const url = tab.history[tab.historyIndex];
  
  try {
    if (tab.webviewLabel && url !== 'about:blank') {
      await invoke('navigate_webview', {
        tabId: tabId,
        url: url
      });
    }
    tab.url = url;
    // Загружаем фавикон при навигации вперед через бэкенд
    try {
      const faviconDataUrl = await invoke<string>('fetch_favicon_backend', { url: url });
      tab.favicon = faviconDataUrl;
    } catch (error) {
      console.error(`Failed to fetch favicon for ${url} via backend:`, error);
      tab.favicon = undefined;
    }
  } catch (error) {
    console.error('Ошибка навигации вперед:', error);
  }
}

export async function reloadTab(tabId: string): Promise<void> {
  const tab = browserState.tabs.find(t => t.id === tabId);
  if (!tab) return;

  try {
    tab.isLoading = true;
    
    if (tab.webviewLabel && tab.url !== 'about:blank') {
      // При перезагрузке также обновляем фавикон через бэкенд
      try {
        const faviconDataUrl = await invoke<string>('fetch_favicon_backend', { url: tab.url });
        tab.favicon = faviconDataUrl;
      } catch (error) {
        console.error(`Failed to fetch favicon for ${tab.url} via backend:`, error);
        tab.favicon = undefined;
      }
      // Перезагружаем через навигацию на тот же URL
      await invoke('navigate_webview', {
        tabId: tabId,
        url: tab.url
      });
    }
    // Симулируем время загрузки
    setTimeout(() => {
      tab.isLoading = false;
    }, 1000);
  } catch (error) {
    console.error('Ошибка перезагрузки:', error);
    tab.isLoading = false;
  }
}

// Функция для отладки webview'ов
export async function getWebviewInfo(): Promise<string[]> {
  try {
    return await invoke<string[]>('get_webview_info');
  } catch (error) {
    console.error('Ошибка получения информации о webview:', error);
    return [];
  }
}

// Функции для закладок
export function addBookmark(title: string, url: string): void {
  const bookmark: Bookmark = {
    id: generateId(),
    title,
    url,
    createdAt: new Date()
  };
  bookmarks.push(bookmark);
}

export function removeBookmark(bookmarkId: string): void {
  const index = bookmarks.findIndex(b => b.id === bookmarkId);
  if (index !== -1) {
    bookmarks.splice(index, 1);
  }
}

// Функции для истории
export function addToHistory(title: string, url: string): void {
  const existingEntry = history.find(h => h.url === url);
  
  if (existingEntry) {
    existingEntry.visitedAt = new Date();
    existingEntry.visitCount++;
  } else {
    const historyEntry: HistoryEntry = {
      id: generateId(),
      title,
      url,
      visitedAt: new Date(),
      visitCount: 1
    };
    history.unshift(historyEntry);
  }

  // Ограничиваем историю 1000 записей
  if (history.length > 1000) {
    history.splice(1000);
  }
}

export function clearHistory(): void {
  history.splice(0);
}

// Геттеры
export function getActiveTab(): Tab | undefined {
  return browserState.tabs.find(tab => tab.isActive);
}

export function canGoBack(tabId: string): boolean {
  const tab = browserState.tabs.find(t => t.id === tabId);
  return tab ? tab.historyIndex > 0 : false;
}

export function canGoForward(tabId: string): boolean {
  const tab = browserState.tabs.find(t => t.id === tabId);
  return tab ? tab.historyIndex < tab.history.length - 1 : false;
}

// Инициализация - создаем первую вкладку
if (browserState.tabs.length === 0) {
  addTab('about:blank', 'Новая вкладка');
} 

// Настройка обработчика событий изменения URL в webview
listen<{tabId: string, url: string}>('webview-url-changed', (event) => {
  const { tabId, url } = event.payload;
  const tab = browserState.tabs.find(t => t.id === tabId);
  if (tab) {
    tab.url = url;
    tab.isLoading = false;
    
    // Обновляем историю вкладки если URL изменился
    if (tab.history[tab.historyIndex] !== url) {
      tab.history = tab.history.slice(0, tab.historyIndex + 1);
      tab.history.push(url);
      tab.historyIndex = tab.history.length - 1;
    }
    
    // Добавляем в глобальную историю если это не about:blank
    if (url !== 'about:blank') {
      addToHistory(tab.title, url);
    }
  }
});

// Обработка создания новых вкладок из webview
listen<{tabId: string, url: string, title: string, webviewLabel: string}>('new-tab-created', (event) => {
  const { tabId, url, title, webviewLabel } = event.payload;
  
  // Создаем новую вкладку с полученными данными
  const newTab: Tab = {
    id: tabId,
    title: title,
    url: url,
    isActive: false,
    isLoading: true,
    favicon: undefined,
    history: [url],
    historyIndex: 0,
    webviewLabel: webviewLabel
  };
  
  browserState.tabs.push(newTab);
  setActiveTab(tabId); // Переключаемся на новую вкладку
  
  // Добавляем в историю
  if (url !== 'about:blank') {
    addToHistory(title, url);
  }
}); 

// Настройка обработчика событий изменения title в webview
listen<{tabId: string, title: string}>('webview-title-changed', (event) => {
  console.log('🔍 Title event received:', event.payload);
  const { tabId, title } = event.payload;
  const tab = browserState.tabs.find(t => t.id === tabId);
  console.log('🔍 Found tab:', tab ? `${tab.id} - current title: "${tab.title}"` : 'NOT FOUND');
  console.log('🔍 New title:', title);
  console.log('🔍 Title conditions:', {
    hasTab: !!tab,
    hasTitle: !!title,
    notDefaultTitle1: title !== 'Без названия',
    notDefaultTitle2: title !== 'Новая вкладка'
  });
  
  // Временно упрощаем условие для отладки
  if (tab && title && title.trim() && title !== 'undefined' && title !== 'null') {
    console.log('🔍 Updating title from', tab.title, 'to', title);
    tab.title = title;
    console.log('🔍 Title updated, new value:', tab.title);
    
    // Обновляем историю с новым title если URL не about:blank
    if (tab.url !== 'about:blank') {
      addToHistory(title, tab.url);
    }
  } else {
    console.log('🔍 Title update skipped due to conditions');
  }
}); 

// Настройка обработчика событий изменения favicon в webview
listen<{tabId: string, favicon: string | null}>('webview-favicon-changed', (event) => {
  const { tabId, favicon } = event.payload;
  const tab = browserState.tabs.find(t => t.id === tabId);
  if (tab) {
    tab.favicon = favicon || undefined;
  }
}); 