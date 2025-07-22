import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHotkeyHandler, type HotkeyHandler } from '../../utils/hotkeys.js';

// Мок для browser store с использованием vi.hoisted()
const mockBrowserStore = vi.hoisted(() => ({
  getActiveTab: vi.fn(),
  addTab: vi.fn(),
}));

// Мок для Tauri invoke
const mockInvoke = vi.hoisted(() => vi.fn());

// Мок функций
vi.mock('../../stores/browser.svelte.js', () => ({
  getActiveTab: mockBrowserStore.getActiveTab,
  addTab: mockBrowserStore.addTab,
  closeTab: vi.fn(),
  updateTabUrl: vi.fn(),
  browserState: { tabs: [] },
  setActiveTab: vi.fn(),
}));

vi.mock('@tauri-apps/api/core', () => ({
  invoke: mockInvoke,
}));

vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: vi.fn(),
}));

describe('HotkeysLogic - Сценарии 13.1, 13.2, 13.3, 4.1', () => {
  let hotkeyHandler: HotkeyHandler;
  let originalDispatchEvent: typeof document.dispatchEvent;

  beforeEach(() => {
    // Сохраняем оригинальный метод
    originalDispatchEvent = document.dispatchEvent;

    // Мокаем dispatchEvent
    document.dispatchEvent = vi.fn();

    // Создаем handler для тестов
    hotkeyHandler = createHotkeyHandler();

    // Сбрасываем моки
    vi.clearAllMocks();
    mockBrowserStore.getActiveTab.mockReturnValue({
      id: 'test-tab-1',
      title: 'Test Tab',
      url: 'https://example.com',
      isActive: true,
    });
  });

  afterEach(() => {
    document.dispatchEvent = originalDispatchEvent;
  });

  describe('Сценарий 13.1: Ctrl+R для обновления', () => {
    it('должен обновлять активную вкладку при Ctrl+R', async () => {
      const mockTab = { id: 'test-tab-1', url: 'https://example.com' };
      mockBrowserStore.getActiveTab.mockReturnValue(mockTab);

      // Симулируем нажатие Ctrl+R
      const keydownEvent = new KeyboardEvent('keydown', {
        key: 'r',
        ctrlKey: true,
        bubbles: true,
      });

      // Имитируем preventDefault
      const preventDefaultSpy = vi.spyOn(keydownEvent, 'preventDefault');

      // Вызываем обработчик
      await hotkeyHandler.handleKeydownEvent(keydownEvent);

      // Проверяем, что preventDefault был вызван
      expect(preventDefaultSpy).toHaveBeenCalled();

      // Проверяем, что invoke был вызван с правильными параметрами
      expect(mockInvoke).toHaveBeenCalledWith('navigate_webview', {
        tabId: 'test-tab-1',
        url: 'https://example.com',
      });
    });

    it('не должен обновлять если нет активной вкладки при Ctrl+R', async () => {
      mockBrowserStore.getActiveTab.mockReturnValue(null);

      const keydownEvent = new KeyboardEvent('keydown', {
        key: 'r',
        ctrlKey: true,
        bubbles: true,
      });

      await hotkeyHandler.handleKeydownEvent(keydownEvent);

      // invoke не должен быть вызван
      expect(mockInvoke).not.toHaveBeenCalled();
    });
  });

  describe('Сценарий 13.3: F5 для обновления', () => {
    it('должен обновлять активную вкладку при F5', async () => {
      const mockTab = { id: 'test-tab-2', url: 'https://github.com' };
      mockBrowserStore.getActiveTab.mockReturnValue(mockTab);

      const keydownEvent = new KeyboardEvent('keydown', {
        key: 'F5',
        bubbles: true,
      });

      const preventDefaultSpy = vi.spyOn(keydownEvent, 'preventDefault');

      await hotkeyHandler.handleKeydownEvent(keydownEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(mockInvoke).toHaveBeenCalledWith('navigate_webview', {
        tabId: 'test-tab-2',
        url: 'https://github.com',
      });
    });

    it('не должен обновлять если нет активной вкладки при F5', async () => {
      mockBrowserStore.getActiveTab.mockReturnValue(undefined);

      const keydownEvent = new KeyboardEvent('keydown', {
        key: 'F5',
        bubbles: true,
      });

      await hotkeyHandler.handleKeydownEvent(keydownEvent);

      expect(mockInvoke).not.toHaveBeenCalled();
    });
  });

  describe('Сценарий 4.1: Ctrl+T для создания новой вкладки', () => {
    it('должен создавать новую вкладку при Ctrl+T', async () => {
      const keydownEvent = new KeyboardEvent('keydown', {
        key: 't',
        ctrlKey: true,
        bubbles: true,
      });

      const preventDefaultSpy = vi.spyOn(keydownEvent, 'preventDefault');

      await hotkeyHandler.handleKeydownEvent(keydownEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(mockBrowserStore.addTab).toHaveBeenCalled();
    });

    it('не должен создавать новую вкладку в input полях при Ctrl+T', async () => {
      const inputElement = document.createElement('input');
      const keydownEvent = new KeyboardEvent('keydown', {
        key: 't',
        ctrlKey: true,
        bubbles: true,
      });
      Object.defineProperty(keydownEvent, 'target', { value: inputElement });

      await hotkeyHandler.handleKeydownEvent(keydownEvent);

      expect(mockBrowserStore.addTab).not.toHaveBeenCalled();
    });
  });

  describe('Сценарий 13.2: Ctrl+L для фокуса на адресную строку', () => {
    it('должен отправлять custom event при Ctrl+L', async () => {
      const keydownEvent = new KeyboardEvent('keydown', {
        key: 'l',
        ctrlKey: true,
        bubbles: true,
      });

      const preventDefaultSpy = vi.spyOn(keydownEvent, 'preventDefault');

      await hotkeyHandler.handleKeydownEvent(keydownEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(document.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'focusAddressBar',
        })
      );
    });

    it('должен работать даже в input полях при Ctrl+L', async () => {
      // Мокаем input элемент как target
      const inputElement = document.createElement('input');
      const keydownEvent = new KeyboardEvent('keydown', {
        key: 'l',
        ctrlKey: true,
        bubbles: true,
      });

      // Подменяем target
      Object.defineProperty(keydownEvent, 'target', {
        value: inputElement,
        enumerable: true,
      });

      const preventDefaultSpy = vi.spyOn(keydownEvent, 'preventDefault');

      await hotkeyHandler.handleKeydownEvent(keydownEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(document.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'focusAddressBar',
        })
      );
    });
  });

  describe('Игнорирование горячих клавиш в полях ввода', () => {
    it('должен игнорировать Ctrl+R в input полях', async () => {
      const inputElement = document.createElement('input');
      const keydownEvent = new KeyboardEvent('keydown', {
        key: 'r',
        ctrlKey: true,
        bubbles: true,
      });

      Object.defineProperty(keydownEvent, 'target', {
        value: inputElement,
        enumerable: true,
      });

      await hotkeyHandler.handleKeydownEvent(keydownEvent);

      // invoke не должен быть вызван
      expect(mockInvoke).not.toHaveBeenCalled();
    });

    it('должен игнорировать F5 в textarea', async () => {
      const textareaElement = document.createElement('textarea');
      const keydownEvent = new KeyboardEvent('keydown', {
        key: 'F5',
        bubbles: true,
      });

      Object.defineProperty(keydownEvent, 'target', {
        value: textareaElement,
        enumerable: true,
      });

      await hotkeyHandler.handleKeydownEvent(keydownEvent);

      expect(mockInvoke).not.toHaveBeenCalled();
    });

    it('должен игнорировать горячие клавиши в contenteditable элементах', async () => {
      const editableElement = document.createElement('div');
      editableElement.contentEditable = 'true';

      const keydownEvent = new KeyboardEvent('keydown', {
        key: 'r',
        ctrlKey: true,
        bubbles: true,
      });

      Object.defineProperty(keydownEvent, 'target', {
        value: editableElement,
        enumerable: true,
      });

      await hotkeyHandler.handleKeydownEvent(keydownEvent);

      expect(mockInvoke).not.toHaveBeenCalled();
    });
  });

  describe('Утилитарные функции', () => {
    it('должен корректно определять input элементы', () => {
      const inputElement = document.createElement('input');
      const textareaElement = document.createElement('textarea');
      const divElement = document.createElement('div');
      divElement.contentEditable = 'true';
      const normalDiv = document.createElement('div');

      expect(hotkeyHandler.isInputElement(inputElement)).toBe(true);
      expect(hotkeyHandler.isInputElement(textareaElement)).toBe(true);
      expect(hotkeyHandler.isInputElement(divElement)).toBe(true);
      expect(hotkeyHandler.isInputElement(normalDiv)).toBe(false);
      expect(hotkeyHandler.isInputElement(null)).toBe(false);
    });

    it('должен корректно определять когда игнорировать событие', () => {
      const inputElement = document.createElement('input');

      // Ctrl+R в input должно игнорироваться
      const ctrlREvent = new KeyboardEvent('keydown', {
        key: 'r',
        ctrlKey: true,
        bubbles: true,
      });
      Object.defineProperty(ctrlREvent, 'target', { value: inputElement });

      expect(hotkeyHandler.shouldIgnoreEvent(ctrlREvent)).toBe(true);

      // Ctrl+L в input НЕ должно игнорироваться
      const ctrlLEvent = new KeyboardEvent('keydown', {
        key: 'l',
        ctrlKey: true,
        bubbles: true,
      });
      Object.defineProperty(ctrlLEvent, 'target', { value: inputElement });

      expect(hotkeyHandler.shouldIgnoreEvent(ctrlLEvent)).toBe(false);
    });
  });

  describe('Комбинации клавиш', () => {
    it('должен различать Ctrl+R и обычную клавишу R', async () => {
      // Обычная клавиша R
      const normalREvent = new KeyboardEvent('keydown', {
        key: 'r',
        ctrlKey: false,
        bubbles: true,
      });

      await hotkeyHandler.handleKeydownEvent(normalREvent);

      expect(mockInvoke).not.toHaveBeenCalled();
    });

    it('должен различать Ctrl+L и обычную клавишу L', async () => {
      const normalLEvent = new KeyboardEvent('keydown', {
        key: 'l',
        ctrlKey: false,
        bubbles: true,
      });

      await hotkeyHandler.handleKeydownEvent(normalLEvent);

      expect(document.dispatchEvent).not.toHaveBeenCalled();
    });
  });

  describe('Прямые вызовы методов', () => {
    it('handleReload должен обновлять активную вкладку', async () => {
      const mockTab = { id: 'direct-tab', url: 'https://test.com' };
      mockBrowserStore.getActiveTab.mockReturnValue(mockTab);

      await hotkeyHandler.handleReload();

      expect(mockInvoke).toHaveBeenCalledWith('navigate_webview', {
        tabId: 'direct-tab',
        url: 'https://test.com',
      });
    });

    it('handleCtrlL должен отправлять custom event', () => {
      hotkeyHandler.handleCtrlL();

      expect(document.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'focusAddressBar',
        })
      );
    });
  });
});
