import {
  getActiveTab,
  closeTab,
  browserState,
  setActiveTab,
  addTab,
} from '../stores/browser.svelte.js';
import { invoke } from '@tauri-apps/api/core';

export type HotkeyHandler = {
  handleReload: () => Promise<void>;
  handleCtrlL: () => void;
  handleNewTab: () => Promise<void>; // Добавлено для Сценария 4.1
  isInputElement: (target: EventTarget | null) => boolean;
  shouldIgnoreEvent: (event: KeyboardEvent) => boolean;
  handleKeydownEvent: (event: KeyboardEvent) => Promise<void>;
  handleNewWindow: () => Promise<void>;
  handleCloseWindow: () => Promise<void>;
};

/**
 * Создает обработчики для глобальных горячих клавиш
 * Сценарии 13.1, 13.2, 13.3, 4.1 из MVP
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

  // Обработчик создания новой вкладки (сценарий 4.1)
  async function handleNewTab(): Promise<void> {
    console.log('➕ Горячие клавиши: создание новой вкладки');
    await addTab(); // Вызываем функцию создания новой вкладки
  }

  // Обработчик открытия нового окна
  async function handleNewWindow(): Promise<void> {
    console.log('➕ Горячие клавиши: создание нового окна');
    await invoke('create_new_window');
  }

  // Обработчик закрытия текущего окна
  async function handleCloseWindow(): Promise<void> {
    console.log('✖️ Горячие клавиши: закрытие текущего окна');
    await invoke('close_current_window');
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

    // Для Ctrl+L, Ctrl+T, Ctrl+W, Ctrl+N, Ctrl+Shift+N, Ctrl+Tab, Ctrl+Shift+Tab разрешаем работать даже в input полях
    if (
      (event.ctrlKey || event.metaKey) &&
      (event.key === 'l' || event.key === 'w' || event.key === 'n' || event.key === 'Tab')
    ) {
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

    // Проверяем, если модификаторы (Ctrl/Cmd) не нажаты, но это Ctrl+L, то игнорируем
    if (!(event.ctrlKey || event.metaKey) && event.key === 'l') {
      return;
    }

    // Сценарий 13.1: Ctrl+R для обновления страницы
    if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
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

    // Сценарий 4.1: Ctrl+T для создания новой вкладки
    if ((event.ctrlKey || event.metaKey) && event.key === 't' && !event.shiftKey) {
      event.preventDefault();
      await handleNewTab();
      return;
    }

    // Сценарий 13.2: Ctrl+L для фокуса на адресную строку
    if ((event.ctrlKey || event.metaKey) && event.key === 'l') {
      event.preventDefault();
      handleCtrlL();
      return;
    }

    // Ctrl + W (или Cmd + W на Mac) - закрыть вкладку
    if ((event.ctrlKey || event.metaKey) && event.key === 'w') {
      event.preventDefault();
      const activeTab = getActiveTab();
      if (activeTab) {
        await closeTab(activeTab.id);
      }
      return;
    }

    // Ctrl + N (или Cmd + N на Mac) - новое окно
    if ((event.ctrlKey || event.metaKey) && event.key === 'n' && !event.shiftKey) {
      event.preventDefault();
      await handleNewWindow();
      return;
    }

    // Ctrl + Shift + N (или Cmd + Shift + N на Mac) - новое приватное окно (в будущем)
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'N') {
      event.preventDefault();
      // await handleNewPrivateWindow(); // TODO: Реализовать приватное окно
      console.log('Private window hotkey pressed (Ctrl+Shift+N)');
      return;
    }

    // Ctrl + Shift + W (или Cmd + Shift + W на Mac) - закрыть текущее окно
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'W') {
      event.preventDefault();
      await handleCloseWindow();
      return;
    }

    // Ctrl + Tab - переключение вкладок (вперед)
    if ((event.ctrlKey || event.metaKey) && event.key === 'Tab' && !event.shiftKey) {
      event.preventDefault();
      const tabs = browserState.tabs;
      if (tabs.length <= 1) return;

      const activeIndex = tabs.findIndex((tab) => tab.isActive);
      let nextIndex = (activeIndex + 1) % tabs.length;
      if (tabs[nextIndex].url === 'about:blank' && tabs.length > 1 && !tabs[nextIndex].isActive) {
        nextIndex = (nextIndex + 1) % tabs.length;
      }
      await setActiveTab(tabs[nextIndex].id);
      return;
    }

    // Ctrl + Shift + Tab - переключение вкладок (назад)
    if ((event.ctrlKey || event.metaKey) && event.key === 'Tab' && event.shiftKey) {
      event.preventDefault();
      const tabs = browserState.tabs;
      if (tabs.length <= 1) return;

      const activeIndex = tabs.findIndex((tab) => tab.isActive);
      let prevIndex = (activeIndex - 1 + tabs.length) % tabs.length;
      if (tabs[prevIndex].url === 'about:blank' && tabs.length > 1 && !tabs[prevIndex].isActive) {
        prevIndex = (prevIndex - 1 + tabs.length) % tabs.length;
      }
      await setActiveTab(tabs[prevIndex].id);
      return;
    }
  }

  return {
    handleReload,
    handleCtrlL,
    handleNewTab, // Добавлено
    isInputElement,
    shouldIgnoreEvent,
    handleKeydownEvent,
    handleNewWindow,
    handleCloseWindow,
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

  document.addEventListener('keydown', keydownListener);

  // Возвращаем функцию очистки
  return () => {
    document.removeEventListener('keydown', keydownListener);
  };
}
