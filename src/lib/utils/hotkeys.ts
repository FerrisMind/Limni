import { getActiveTab, reloadTab } from '../stores/browser.svelte.js';

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
      await reloadTab(activeTab.id);
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

  document.addEventListener('keydown', keydownListener);

  // Возвращаем функцию очистки
  return () => {
    document.removeEventListener('keydown', keydownListener);
  };
}
