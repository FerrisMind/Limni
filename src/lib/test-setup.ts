import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Мокаем Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn().mockResolvedValue(() => {}),
  emit: vi.fn().mockResolvedValue(undefined),
}));

// Мокаем глобальные объекты браузера
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Мокаем DataTransfer для тестов clipboard
class MockDataTransfer {
  private data: Map<string, string> = new Map();

  setData(format: string, data: string) {
    this.data.set(format, data);
  }

  getData(format: string): string {
    return this.data.get(format) || '';
  }

  clearData(format?: string) {
    if (format) {
      this.data.delete(format);
    } else {
      this.data.clear();
    }
  }
}

// @ts-expect-error - Mock DataTransfer for testing
globalThis.DataTransfer = MockDataTransfer;

// Мокаем URL constructor для тестов IDN доменов
const originalURL = globalThis.URL;
// @ts-expect-error - Mock URL for testing
globalThis.URL = class extends originalURL {
  constructor(url: string, base?: string | URL) {
    // Обрабатываем кириллические домены
    if (typeof url === 'string' && /[а-яё]/i.test(url)) {
      // Простая проверка валидности для тестов
      if (url.includes('.') && !url.includes(' ')) {
        super(url.includes('://') ? url : `https://${url}`, base);
        return;
      }
    }
    super(url, base);
  }
};
