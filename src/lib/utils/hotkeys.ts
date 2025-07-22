import { getActiveTab, closeTab, updateTabUrl, browserState, setActiveTab } from '../stores/browser.svelte.js';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';

export type HotkeyHandler = {
  handleReload: () => Promise<void>;
  handleCtrlL: () => void;
  isInputElement: (target: EventTarget | null) => boolean;
  shouldIgnoreEvent: (event: KeyboardEvent) => boolean;
  handleKeydownEvent: (event: KeyboardEvent) => Promise<void>;
};

/**
 * Создает обработчики для глобальных горячих клавиш
 * Сценарии 13.1, 13.2, 13.3 из MVP
 */
export function createHotkeyHandler(): HotkeyHandler {
  // Обработчик обновления страницы (сценарии 13.1 и 13.3)
  async function handleReload(): Promise<void> {
    const activeTab = getActiveTab();
    if (activeTab) {
      console.log('🔄 Горячие клавиши: обновление вкладки', activeTab.id);
      await invoke('navigate_webview', {
        tabId: activeTab.id,
        url: activeTab.url,
      });
      // Симулируем isLoading для UI
      activeTab.isLoading = true;
      // Добавляем небольшой таймаут, чтобы UI показал загрузку
      setTimeout(() => {
        activeTab.isLoading = false;
      }, 500);
    }
  }

  // Обработчик фокуса на адресную строку (сценарий 13.2)
  function handleCtrlL(): void {
    console.log('🎯 Горячие клавиши: фокус на адресную строку');

    // Используем custom event для уведомления AddressBar
    const focusEvent = new CustomEvent('focusAddressBar');
    document.dispatchEvent(focusEvent);
  }

  // Проверяет, является ли элемент полем ввода
  function isInputElement(target: EventTarget | null): boolean {
    if (!target) return false;

    const element = target as HTMLElement;
    return (
      element.tagName === 'INPUT' ||
      element.tagName === 'TEXTAREA' ||
      element.contentEditable === 'true'
    );
  }

  // Проверяет, нужно ли игнорировать событие
  function shouldIgnoreEvent(event: KeyboardEvent): boolean {
    const isInput = isInputElement(event.target);

    // Для Ctrl+L разрешаем работать даже в input полях
    if (event.ctrlKey && event.key === 'l') {
      return false;
    }

    // Для остальных горячих клавиш игнорируем в input полях
    return isInput;
  }

  // Главный обработчик событий клавиатуры
  async function handleKeydownEvent(event: KeyboardEvent): Promise<void> {
    if (shouldIgnoreEvent(event)) {
      return;
    }

    // Сценарий 13.1: Ctrl+R для обновления страницы
    if (event.ctrlKey && event.key === 'r') {
      event.preventDefault();
      await handleReload();
      return;
    }

    // Сценарий 13.3: F5 для обновления страницы
    if (event.key === 'F5') {
      event.preventDefault();
      await handleReload();
      return;
    }

    // Сценарий 13.2: Ctrl+L для фокуса на адресную строку
    if (event.ctrlKey && event.key === 'l') {
      event.preventDefault();
      handleCtrlL();
      return;
    }
  }

  return {
    handleReload,
    handleCtrlL,
    isInputElement,
    shouldIgnoreEvent,
    handleKeydownEvent,
  };
}

/**
 * Инициализирует глобальные горячие клавиши
 * Возвращает функцию очистки
 */
export function initializeGlobalHotkeys(): () => void {
  const hotkeyHandler = createHotkeyHandler();

  // Обертка для async функции
  const keydownListener = (event: KeyboardEvent) => {
    hotkeyHandler.handleKeydownEvent(event).catch(console.error);
  };

  document.addEventListener('keydown', async (event) => {
    // Игнорируем события, если фокус находится в полях ввода
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    // Ctrl + L (или Cmd + L на Mac) - фокус на адресную строку
    if ((event.ctrlKey || event.metaKey) && event.key === 'l') {
      event.preventDefault();
      const addressBar = document.querySelector('.address-bar input') as HTMLInputElement;
      if (addressBar) {
        addressBar.focus();
        addressBar.select(); // Выделяем весь текст
      }
    }

    // F5 или Ctrl + R (или Cmd + R на Mac) - перезагрузка страницы
    if (event.key === 'F5' || ((event.ctrlKey || event.metaKey) && event.key === 'r')) {
      event.preventDefault();
      const activeTab = getActiveTab();
      if (activeTab && activeTab.webviewLabel) {
        await invoke('navigate_webview', {
          tabId: activeTab.id,
          url: activeTab.url,
        });
        // Симулируем isLoading для UI
        activeTab.isLoading = true;
        // Добавляем небольшой таймаут, чтобы UI показал загрузку
        setTimeout(() => {
          activeTab.isLoading = false;
        }, 500);
      }
    }

    // Ctrl + T (или Cmd + T на Mac) - новая вкладка
    if ((event.ctrlKey || event.metaKey) && event.key === 't') {
      event.preventDefault();
      await invoke('open_url_in_new_tab', { url: 'about:blank' });
    }

    // Ctrl + W (или Cmd + W на Mac) - закрыть вкладку
    if ((event.ctrlKey || event.metaKey) && event.key === 'w') {
      event.preventDefault();
      const activeTab = getActiveTab();
      if (activeTab) {
        await closeTab(activeTab.id);
      }
    }

    // Ctrl + Tab - переключение вкладок (вперед)
    if ((event.ctrlKey || event.metaKey) && event.key === 'Tab' && !event.shiftKey) {
      event.preventDefault();
      // Логика переключения вперед
      const tabs = browserState.tabs;
      if (tabs.length <= 1) return;

      const activeIndex = tabs.findIndex(tab => tab.isActive);
      let nextIndex = (activeIndex + 1) % tabs.length;
      // Пропускаем 'about:blank' вкладки при переключении, если они не активны и есть другие вкладки
      if (tabs[nextIndex].url === 'about:blank' && tabs.length > 1 && !tabs[nextIndex].isActive) {
        nextIndex = (nextIndex + 1) % tabs.length;
      }

      await setActiveTab(tabs[nextIndex].id);
    }

    // Ctrl + Shift + Tab - переключение вкладок (назад)
    if ((event.ctrlKey || event.metaKey) && event.key === 'Tab' && event.shiftKey) {
      event.preventDefault();
      // Логика переключения назад
      const tabs = browserState.tabs;
      if (tabs.length <= 1) return;

      const activeIndex = tabs.findIndex(tab => tab.isActive);
      let prevIndex = (activeIndex - 1 + tabs.length) % tabs.length;
      // Пропускаем 'about:blank' вкладки при переключении, если они не активны и есть другие вкладки
      if (tabs[prevIndex].url === 'about:blank' && tabs.length > 1 && !tabs[prevIndex].isActive) {
        prevIndex = (prevIndex - 1 + tabs.length) % tabs.length;
      }
      await setActiveTab(tabs[prevIndex].id);
    }
  });

  // Возвращаем функцию очистки
  return () => {
    document.removeEventListener('keydown', keydownListener);
  };
}
