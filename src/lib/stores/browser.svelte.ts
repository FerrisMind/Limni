import type {
  Tab,
  BrowserState,
  Bookmark,
  HistoryEntry,
  BrowserSettings,
} from '../types/browser.js';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

// Генерация уникального ID
function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// 👉 NEW: Utility that helps us decide whether a title is "generic"
// (i.e. search engine home pages, host names, placeholders, etc.)
function isGenericTitle(title: string | undefined, url: string | undefined): boolean {
  if (!title) return true;

  const genericTitles = new Set([
    'Новая вкладка',
    'Без названия',
    'Яндекс',
    'Google',
    'GitHub',
    'Microsoft Bing',
    'Загрузка...',
    'Загрузка',
  ]);

  const trimmed = title.trim();
  if (genericTitles.has(trimmed)) return true;

  if (url) {
    try {
      const hostname = new URL(url).hostname.replace(/^www\./, '');
      const domainPart = hostname.split('.')[0];
      if (
        trimmed.toLowerCase() === hostname.toLowerCase() ||
        trimmed.toLowerCase() === domainPart.toLowerCase()
      ) {
        return true;
      }
    } catch {
      /* malformed url – ignore */
    }
  }

  // Short 1-word titles are usually generic as well
  if (!trimmed.includes(' ') && trimmed.length <= 6) return true;

  return false;
}

// 👉 Utility to decode HTML entities which come from fallback JS (&#1040; etc.)
function decodeHtmlEntities(str: string | undefined): string {
  if (!str) return '';
  // Fast check: if no entity marker, return as is
  if (!/&[#a-zA-Z0-9]+;/.test(str)) return str;
  const textarea = document.createElement('textarea');
  textarea.innerHTML = str;
  return textarea.value;
}

function isLoadingPlaceholder(title: string | undefined): boolean {
  if (!title) return false;
  const trimmed = title.trim();
  return trimmed === 'Загрузка...' || trimmed === 'Загрузка';
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
    favicon: undefined, // Убедимся, что favicon инициализируется как undefined
    hasAudio: false, // Изначально звука нет
    isAudioMuted: false, // Изначально звук не заглушен
    hasError: false, // Изначально ошибок нет
    errorMessage: undefined, // Изначально сообщения об ошибке нет
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
  showMainMenu: false,
});

// Глобальное состояние окна
export const windowState = $state({
  isMaximized: false,
});

// Закладки
export const bookmarks = $state<Bookmark[]>([
  {
    id: generateId(),
    title: 'Google',
    url: 'https://www.google.com',
    createdAt: new Date(),
  },
  {
    id: generateId(),
    title: 'GitHub',
    url: 'https://github.com',
    createdAt: new Date(),
  },
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
  allowCookies: true,
});

// Функции для работы с вкладками
export async function addTab(
  url: string = 'about:blank',
  title: string = 'Новая вкладка'
): Promise<void> {
  // Если открываем не about:blank, показываем временный заголовок «Загрузка…»
  const initialTitle = url === 'about:blank' ? title : 'Загрузка...';
  const newTab = createTab(url, initialTitle);
  browserState.tabs.push(newTab);

  try {
    // Создаем webview для новой вкладки, если это не about:blank
    if (url !== 'about:blank') {
      const webviewLabel = await invoke<string>('create_tab_webview', {
        tabId: newTab.id,
        url: url,
        title: 'Загрузка...',
      });

      newTab.webviewLabel = webviewLabel;
      newTab.isLoading = true;

      // Историю пока не добавляем – дождёмся реального названия после загрузки

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
  const tabIndex = browserState.tabs.findIndex((tab) => tab.id === tabId);
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
    browserState.tabs.forEach((tab) => {
      tab.isActive = tab.id === tabId;
    });
    browserState.activeTabId = tabId;

    // Показываем соответствующий webview или скрываем все
    const activeTab = browserState.tabs.find((t) => t.id === tabId);
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

export async function updateTabUrl(tabId: string, url: string, _title?: string): Promise<void> {
  const tab = browserState.tabs.find((t) => t.id === tabId);
  if (!tab) return;

  try {
    tab.isLoading = true;
    tab.hasError = false; // Сбрасываем ошибку при новой навигации
    tab.errorMessage = undefined;

    // Если у вкладки уже есть webview, используем навигацию
    if (tab.webviewLabel && url !== 'about:blank') {
      try {
        await invoke('navigate_webview', {
          tabId: tabId,
          url: url,
        });
        console.log('🔄 Navigated existing webview for tab:', tabId, 'to:', url);
      } catch (error) {
        console.error('Navigation failed, creating new webview:', error);
        // Если навигация не удалась, создаем новый webview
        await invoke('close_tab_webview', { tabId: tabId });
        tab.webviewLabel = undefined;
        
        const webviewLabel = await invoke<string>('create_tab_webview', {
          tabId: tabId,
          url: url,
          title: 'Загрузка...',
        });
        tab.webviewLabel = webviewLabel;
        
        if (tab.isActive) {
          await invoke('show_tab_webview', { tabId: tabId });
        }
      }
    } else {
      // Закрываем существующий webview если он есть
      if (tab.webviewLabel) {
        try {
          await invoke('close_tab_webview', { tabId: tabId });
          tab.webviewLabel = undefined; // Сбрасываем метку старого webview
        } catch (error) {
          console.error('Ошибка закрытия старого webview при навигации:', error);
        }
      }

      // Создаем новый webview для навигации (для about:blank не создаем)
      if (url !== 'about:blank') {
        const webviewLabel = await invoke<string>('create_tab_webview', {
          tabId: tabId,
          url: url,
          title: 'Загрузка...',
        });

        tab.webviewLabel = webviewLabel;

        // Если это активная вкладка, показываем новый webview
        if (tab.isActive) {
          await invoke('show_tab_webview', { tabId: tabId });
        }
      }
    }

    // Обновляем данные вкладки – временно показываем «Загрузка…»
    tab.url = url;
    tab.title = 'Загрузка...';

    // Добавляем в историю вкладки
    if (tab.history[tab.historyIndex] !== url) {
      tab.history = tab.history.slice(0, tab.historyIndex + 1);
      tab.history.push(url);
      tab.historyIndex = tab.history.length - 1;
    }

    // Добавляем в общую историю
    if (url !== 'about:blank' && !url.startsWith('about:')) {
      // Историю запишем с URL, позже обновим при получении реального заголовка
      addToHistory(tab.title, url);

      // Принудительно запрашиваем favicon и title после навигации
      // Эти вызовы могут быть убраны, если on_page_load и on_navigation станут надежными
      try {
        const faviconDataUrl = await invoke<string>('fetch_favicon_backend', { url: url });
        tab.favicon = faviconDataUrl;
      } catch (error) {
        console.error(`Failed to fetch favicon for ${url} via backend:`, error);
        tab.favicon = undefined;
      }

      try {
        const realTitle = await invoke<string>('fetch_page_title_backend', { url: url });
        tab.title = realTitle;
      } catch (error) {
        console.error(`Failed to fetch real title for ${url} via backend:`, error);
      }
    }

    tab.isLoading = false; // Принудительно завершаем загрузку после попытки навигации
  } catch (error) {
    console.error('Ошибка навигации:', error);
    tab.isLoading = false;
  }
}

export async function navigateBack(tabId: string): Promise<void> {
  const tab = browserState.tabs.find((t) => t.id === tabId);
  if (!tab || tab.historyIndex <= 0) return;

  tab.historyIndex--;
  const url = tab.history[tab.historyIndex];

  try {
    // Если у вкладки нет webview, создаем его
    if (!tab.webviewLabel && url !== 'about:blank') {
      const webviewLabel = await invoke<string>('create_tab_webview', {
        tabId: tabId,
        url: url,
        title: 'Загрузка...',
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
        url: url,
      });
    }

    tab.url = url;

    // Восстанавливаем заголовок из глобальной истории
    const historyEntry = history.find((h) => h.url === url);
    if (historyEntry) {
      tab.title = historyEntry.title;
      console.log('🔙 Restored title from history:', historyEntry.title, 'for URL:', url);
    } else {
      // Если в истории нет записи, устанавливаем временный заголовок
      tab.title = url === 'about:blank' ? 'Новая вкладка' : 'Загрузка...';
      console.log('🔙 No history entry found, set temporary title for URL:', url);
    }

    // Загружаем фавикон при навигации назад через бэкенд (только для обычных URL)
    if (url !== 'about:blank' && !url.startsWith('about:')) {
      try {
        const faviconDataUrl = await invoke<string>('fetch_favicon_backend', { url: url });
        tab.favicon = faviconDataUrl;
      } catch (error) {
        console.error(`Failed to fetch favicon for ${url} via backend:`, error);
        tab.favicon = undefined;
      }
    } else {
      tab.favicon = undefined; // Очищаем favicon для специальных URL
    }
  } catch (error) {
    console.error('Ошибка навигации назад:', error);
  }
}

export async function navigateForward(tabId: string): Promise<void> {
  const tab = browserState.tabs.find((t) => t.id === tabId);
  if (!tab || tab.historyIndex >= tab.history.length - 1) return;

  tab.historyIndex++;
  const url = tab.history[tab.historyIndex];

  try {
    // Если у вкладки нет webview, создаем его
    if (!tab.webviewLabel && url !== 'about:blank') {
      const webviewLabel = await invoke<string>('create_tab_webview', {
        tabId: tabId,
        url: url,
        title: 'Загрузка...',
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
        url: url,
      });
    }

    tab.url = url;

    // Восстанавливаем заголовок из глобальной истории
    const historyEntry = history.find((h) => h.url === url);
    if (historyEntry) {
      tab.title = historyEntry.title;
      console.log('🔜 Restored title from history:', historyEntry.title, 'for URL:', url);
    } else {
      // Если в истории нет записи, устанавливаем временный заголовок
      tab.title = url === 'about:blank' ? 'Новая вкладка' : 'Загрузка...';
      console.log('🔜 No history entry found, set temporary title for URL:', url);
    }

    // Загружаем фавикон при навигации вперед через бэкенд (только для обычных URL)
    if (url !== 'about:blank' && !url.startsWith('about:')) {
      try {
        const faviconDataUrl = await invoke<string>('fetch_favicon_backend', { url: url });
        tab.favicon = faviconDataUrl;
      } catch (error) {
        console.error(`Failed to fetch favicon for ${url} via backend:`, error);
        tab.favicon = undefined;
      }
    } else {
      tab.favicon = undefined; // Очищаем favicon для специальных URL
    }
  } catch (error) {
    console.error('Ошибка навигации вперед:', error);
  }
}

export async function reloadTab(tabId: string): Promise<void> {
  const tab = browserState.tabs.find((t) => t.id === tabId);
  if (!tab) return;

  try {
    tab.isLoading = true;

    if (tab.webviewLabel && tab.url !== 'about:blank') {
      // При перезагрузке также обновляем фавикон через бэкенд (только для обычных URL)
      if (!tab.url.startsWith('about:')) {
        try {
          const faviconDataUrl = await invoke<string>('fetch_favicon_backend', { url: tab.url });
          tab.favicon = faviconDataUrl;
        } catch (error) {
          console.error(`Failed to fetch favicon for ${tab.url} via backend:`, error);
          tab.favicon = undefined;
        }
      } else {
        tab.favicon = undefined; // Очищаем favicon для специальных URL
      }
      // Перезагружаем через навигацию на тот же URL
      await invoke('navigate_webview', {
        tabId: tabId,
        url: tab.url,
      });
    }
  } catch (error) {
    console.error('Ошибка перезагрузки:', error);
    tab.isLoading = false;
  }
}

// Функция для перехода на домашнюю страницу
export async function navigateToHome(tabId: string): Promise<void> {
  const tab = browserState.tabs.find((t) => t.id === tabId);
  if (!tab) return;

  console.log('🏠 Navigate to home called for tab:', tabId, 'current URL:', tab.url);
  tab.isLoading = true;

  try {
    // Если у вкладки нет webview, создаем его
    if (!tab.webviewLabel) {
      console.log('🏠 Creating webview for tab:', tabId);
      const webviewLabel = await invoke<string>('create_tab_webview', {
        tabId,
        url: settings.homepage,
        title: 'Домашняя страница',
      });
      console.log('🏠 Webview created:', webviewLabel);

      // КРИТИЧЕСКИ ВАЖНО: сохраняем webviewLabel в состоянии вкладки
      tab.webviewLabel = webviewLabel;

      // Показываем webview если это активная вкладка
      if (browserState.activeTabId === tabId) {
        console.log('🏠 Showing webview for active tab:', tabId);
        await invoke('show_tab_webview', { tabId });
      }
    } else {
      console.log('🏠 Navigating existing webview for tab:', tabId);
      // Для существующих webview используем обычную навигацию
      await invoke('navigate_webview', {
        tabId,
        url: settings.homepage,
      });
    }

    // Обновляем URL и добавляем в историю
    tab.url = settings.homepage;
    tab.title = 'Загрузка...';

    // Добавляем в историю вкладки если это новый URL
    if (tab.history[tab.historyIndex] !== settings.homepage) {
      // Удаляем все записи после текущей позиции
      tab.history = tab.history.slice(0, tab.historyIndex + 1);
      // Добавляем новый URL
      tab.history.push(settings.homepage);
      tab.historyIndex = tab.history.length - 1;
    }

    console.log('🏠 Navigation completed for tab:', tabId);
    // Состояние будет обновлено через событие webview-url-changed
  } catch (error) {
    console.error('🏠 Failed to navigate to home:', error);
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
    createdAt: new Date(),
  };
  bookmarks.push(bookmark);
}

export function removeBookmark(bookmarkId: string): void {
  const index = bookmarks.findIndex((b) => b.id === bookmarkId);
  if (index !== -1) {
    bookmarks.splice(index, 1);
  }
}

// Функции для истории
export function addToHistory(title: string, url: string): void {
  const existingEntry = history.find((h) => h.url === url);

  if (existingEntry) {
    existingEntry.visitedAt = new Date();
    existingEntry.visitCount++;
  } else {
    const historyEntry: HistoryEntry = {
      id: generateId(),
      title,
      url,
      visitedAt: new Date(),
      visitCount: 1,
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
  return browserState.tabs.find((tab) => tab.isActive);
}

export function canGoBack(tabId: string): boolean {
  const tab = browserState.tabs.find((t) => t.id === tabId);
  return tab ? tab.historyIndex > 0 : false;
}

export function canGoForward(tabId: string): boolean {
  const tab = browserState.tabs.find((t) => t.id === tabId);
  return tab ? tab.historyIndex < tab.history.length - 1 : false;
}

// Инициализация - создаем первую вкладку
if (browserState.tabs.length === 0) {
  addTab('about:blank', 'Новая вкладка');
}

// Настройка обработчика событий изменения URL в webview
listen<{ tabId: string; url: string }>('webview-url-changed', (event) => {
  const { tabId, url } = event.payload;
  const tab = browserState.tabs.find((t) => t.id === tabId);
  if (tab) {
    tab.url = url;
    // Не сбрасываем isLoading здесь – ждём favicon

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
listen<{ tabId: string; url: string; title: string; webviewLabel: string }>(
  'new-tab-created',
  (event) => {
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
      webviewLabel: webviewLabel,
      hasAudio: false,
      isAudioMuted: false,
    };

    browserState.tabs.push(newTab);
    setActiveTab(tabId); // Переключаемся на новую вкладку

    // Добавляем в историю
    if (url !== 'about:blank') {
      addToHistory(title, url);
    }
  }
);

// Настройка обработчика событий изменения title в webview
listen<{ tabId: string; title: string }>('webview-title-changed', (event) => {
  console.log('🔍 Title event received:', event.payload);
  const { tabId, title } = event.payload;
  const decoded = decodeHtmlEntities(title);
  const tab = browserState.tabs.find((t) => t.id === tabId);
  console.log('🔍 Found tab:', tab ? `${tab.id} - current title: "${tab.title}"` : 'NOT FOUND');
  console.log('🔍 Raw title:', title, 'Decoded:', decoded);

  if (!tab) {
    console.log('🔍 Tab not found, skipping title update');
    return; // safety guard
  }

  const newIsGeneric = isGenericTitle(decoded, tab.url);
  const currentIsGeneric = isGenericTitle(tab.title, tab.url);
  const currentIsLoading = isLoadingPlaceholder(tab.title);

  console.log('🔍 Title analysis:', {
    newIsGeneric,
    currentIsGeneric,
    currentIsLoading,
    currentTitle: tab.title,
    newTitle: decoded,
    tabUrl: tab.url,
  });

  // Правильная логика: обновляем только если новый заголовок не генерический
  // или если текущий заголовок генерический/загрузочный
  const shouldUpdate =
    decoded &&
    decoded.trim() &&
    decoded !== 'undefined' &&
    decoded !== 'null' &&
    decoded !== tab.title &&
    (!newIsGeneric || currentIsGeneric || currentIsLoading);

  console.log('🔍 Should update title:', shouldUpdate);

  if (shouldUpdate) {
    console.log('🔍 ✅ Updating title from "' + tab.title + '" to "' + decoded + '"');
    tab.title = decoded;
    tab.isLoading = false; // Останавливаем загрузку при обновлении заголовка
  } else {
    console.log('🔍 ❌ Title update skipped - same title or invalid');
  }
});

// Настройка обработчика событий изменения favicon в webview
listen<{ tabId: string; favicon: string | null }>('webview-favicon-changed', (event) => {
  const { tabId, favicon } = event.payload;
  const tab = browserState.tabs.find((t) => t.id === tabId);
  if (tab) {
    tab.favicon = favicon || undefined;
    // Если фавиконка получена, считаем загрузку завершённой
    if (favicon) {
      tab.isLoading = false;
    }
  }
});

// Функция для переключения звука вкладки
export async function toggleTabAudio(tabId: string) {
  const tab = getTab(tabId);
  if (tab) {
    try {
      if (tab.isAudioMuted) {
        // Включаем звук
        await invoke('unmute_webview', { tabId });
        setTabAudioState(tabId, false);
      } else {
        // Отключаем звук
        await invoke('mute_webview', { tabId });
        setTabAudioState(tabId, true);
      }
    } catch (error) {
      console.error('Failed to toggle tab audio:', error);
    }
  }
}

// Функция для установки состояния звука вкладки
export function setTabAudioState(tabId: string, isMuted: boolean) {
  browserState.tabs = browserState.tabs.map((tab) =>
    tab.id === tabId ? { ...tab, isAudioMuted: isMuted } : tab
  );
}

// Функция для установки наличия звука у вкладки
export function setTabHasAudio(tabId: string, hasAudio: boolean) {
  browserState.tabs = browserState.tabs.map((tab) =>
    tab.id === tabId ? { ...tab, hasAudio, isAudioMuted: hasAudio ? tab.isAudioMuted : false } : tab
  );
}

// Функция для установки ошибки загрузки
export function setTabError(tabId: string, errorMessage: string) {
  const tab = getTab(tabId);
  if (tab) {
    tab.hasError = true;
    tab.errorMessage = errorMessage;
    tab.isLoading = false; // Останавливаем индикатор загрузки
  }
}

// Функция для сброса ошибки
export function clearTabError(tabId: string) {
  const tab = getTab(tabId);
  if (tab) {
    tab.hasError = false;
    tab.errorMessage = undefined;
  }
}

// Обработчик событий изменения состояния звука
listen<{ tabId: string; hasAudio: boolean }>('webview-audio-changed', (event) => {
  const { tabId, hasAudio } = event.payload;
  setTabHasAudio(tabId, hasAudio);
});

// Обработчик событий изменения состояния mute
listen<{ tabId: string; isMuted: boolean }>('webview-mute-changed', (event) => {
  const { tabId, isMuted } = event.payload;
  setTabAudioState(tabId, isMuted);
});

// Обработчик событий ошибки загрузки
listen<{ tabId: string; errorMessage: string }>('webview-load-error', (event) => {
  console.error(`Ошибка загрузки для вкладки ${event.payload.tabId}:`, event.payload.errorMessage);
  setTabError(event.payload.tabId, event.payload.errorMessage);
});

// Функция для получения вкладки по ID
function getTab(tabId: string) {
  return browserState.tabs.find((tab) => tab.id === tabId);
}

// Экспорт объекта browser для совместимости с AddressBar
export const browser = {
  get currentTab() {
    return getActiveTab();
  },
  updateTabUrl,
};
