import { render, fireEvent, screen } from '@testing-library/svelte/svelte5';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SvelteComponent } from 'svelte';
import TabBar from '../TabBar.svelte';
import {
  browserState,
  addTab,
  setActiveTab,
  closeTab,
  toggleTabAudio,
} from '../../stores/browser.svelte.js';

// Мокаем store для изоляции тестов компонента
vi.mock('../../stores/browser.svelte.js', async () => {
  const actual = await vi.importActual('../../stores/browser.svelte.js');
  return {
    ...actual,
    browserState: actual.browserState, // Используем фактический browserState, но можем его мутировать в beforeEach
    addTab: vi.fn(),
    setActiveTab: vi.fn(),
    closeTab: vi.fn(),
    toggleTabAudio: vi.fn(),
    windowState: {
      isMaximized: false,
    },
  };
});

describe('TabBar - Сценарий 4.2: Создание через кнопку "+"', () => {
  beforeEach(() => {
    // Сбрасываем состояние перед каждым тестом
    browserState.tabs = [
      {
        id: 'tab-1',
        title: 'Tab 1',
        url: 'https://example.com/1',
        isActive: true,
        isLoading: false,
        hasError: false,
        history: ['https://example.com/1'],
        historyIndex: 0,
      },
      {
        id: 'tab-2',
        title: 'Tab 2',
        url: 'https://example.com/2',
        isActive: false,
        isLoading: false,
        hasError: false,
        history: ['https://example.com/2'],
        historyIndex: 0,
      },
    ];
    browserState.activeTabId = 'tab-1';
    vi.clearAllMocks();
  });

  it('должен вызывать addTab при клике на кнопку "+"', async () => {
    render(TabBar as any);
    const newTabButton = screen.getByLabelText('Новая вкладка');
    await fireEvent.click(newTabButton);

    expect(addTab).toHaveBeenCalledOnce();
  });

  it('должен отображать кнопку "+" по умолчанию', () => {
    render(TabBar as any);
    const newTabButton = screen.getByLabelText('Новая вкладка');
    expect(newTabButton).toBeInTheDocument();
  });
});

describe('TabBar - Общие сценарии', () => {
  beforeEach(() => {
    browserState.tabs = [
      {
        id: 'tab-1',
        title: 'Tab 1',
        url: 'https://example.com/1',
        isActive: true,
        isLoading: false,
        hasError: false,
        history: ['https://example.com/1'],
        historyIndex: 0,
      },
      {
        id: 'tab-2',
        title: 'Tab 2',
        url: 'https://example.com/2',
        isActive: false,
        isLoading: false,
        hasError: false,
        history: ['https://example.com/2'],
        historyIndex: 0,
      },
      {
        id: 'tab-3',
        title: 'Tab 3',
        url: 'about:blank',
        isActive: false,
        isLoading: true,
        hasError: false,
        history: [],
        historyIndex: 0,
        hasAudio: true,
        isAudioMuted: false,
      },
    ];
    browserState.activeTabId = 'tab-1';
    vi.clearAllMocks();
  });

  it('должен переключать активную вкладку при клике', async () => {
    render(TabBar as any);
    const tab2Button = screen.getByLabelText('Переключиться на вкладку: Tab 2');
    await fireEvent.click(tab2Button);

    expect(setActiveTab).toHaveBeenCalledWith('tab-2');
  });

  it('должен закрывать вкладку при клике на кнопку закрытия', async () => {
    render(TabBar as any);
    const closeButton = screen.getAllByLabelText(/Закрыть вкладку/)[0];
    await fireEvent.click(closeButton);

    expect(closeTab).toHaveBeenCalledWith('tab-1');
  });

  it('должен переключать состояние звука при клике на иконку звука', async () => {
    render(TabBar as any);
    const audioToggleButton = screen.getByLabelText('Отключить звук');
    await fireEvent.click(audioToggleButton);

    expect(toggleTabAudio).toHaveBeenCalledWith('tab-3');
  });

  it('должен обрезать длинные заголовки вкладок', () => {
    browserState.tabs = [
      {
        id: 'tab-long',
        title: 'ОченьДлинныйЗаголовокВкладкиКоторыйДолженБытьОбрезан',
        url: 'https://longurl.com',
        isActive: true,
        isLoading: false,
        hasError: false,
        history: [],
        historyIndex: 0,
      },
    ];
    render(TabBar as any);
    const tabTitle = screen.getByText('ОченьДлинныйЗаго...');
    expect(tabTitle).toBeInTheDocument();
  });

  it('должен закрывать вкладку по среднему клику', async () => {
    render(TabBar as any);
    const tab1Button = screen.getByLabelText('Переключиться на вкладку: Tab 1');
    await fireEvent.mouseDown(tab1Button, { button: 1 }); // Middle click

    expect(closeTab).toHaveBeenCalledWith('tab-1');
  });
});
