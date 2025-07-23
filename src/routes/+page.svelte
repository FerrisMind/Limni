<script lang="ts">
  import '@phosphor-icons/web/regular';
  import '@phosphor-icons/web/bold';
  import Toolbar from '../lib/components/Toolbar.svelte';
  import TabBar from '../lib/components/TabBar.svelte';
  import WebViewManager from '../lib/components/WebViewManager.svelte';
  import BookmarksPanel from '../lib/components/BookmarksPanel.svelte';
  import HistoryPanel from '../lib/components/HistoryPanel.svelte';
  import SettingsPanel from '../lib/components/SettingsPanel.svelte';
  import ExtensionsPanel from '../lib/components/ExtensionsPanel.svelte';
  import DownloadsPanel from '../lib/components/DownloadsPanel.svelte';
  import { getActiveTab, setTabAudioState } from '../lib/stores/browser.svelte.js';
  import { initializeGlobalHotkeys } from '../lib/utils/hotkeys.js';

  // Функция для тестирования звука
  function testAudio() {
    const activeTab = getActiveTab();
    if (activeTab) {
      setTabAudioState(activeTab.id, !activeTab.hasAudio);
    }
  }

  // Инициализация глобальных горячих клавиш при монтировании компонента
  $effect(() => {
    console.log('🎹 Инициализация глобальных горячих клавиш');
    const cleanup = initializeGlobalHotkeys();

    // Очистка при размонтировании
    return () => {
      console.log('🎹 Очистка глобальных горячих клавиш');
      cleanup();
    };
  });
</script>

<div class="browser">
  <!-- <WindowControls /> -->
  <TabBar />
  <Toolbar />
  <WebViewManager />
  <BookmarksPanel />
  <HistoryPanel />
  <SettingsPanel />
  <ExtensionsPanel />
  <DownloadsPanel />

  <!-- Кнопка для тестирования звука (временная) -->
  <div class="test-controls">
    <button class="test-btn" onclick={testAudio}>
      <i class="ph ph-speaker-simple-high"></i>
      Тест звука
    </button>
  </div>
</div>

<style>
  .browser {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--bg-primary);
    font-family:
      -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell',
      'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    user-select: none;
    overflow: hidden;
  }

  /* Улучшенные переменные CSS для светлой темы */
  :root {
    /* Color Palette */
    --accent-color: #007bff; /* Пример акцентного цвета */
    --text-primary: #333;
    --text-secondary: #666;
    --bg-primary: #f0f0f0;
    --bg-secondary: #fff;
    --border-color: #ccc;
    --btn-bg-hover: #e0e0e0;
    --bg-tertiary: #f5f5f5; /* Добавлено для светлой темы */

    /* System Shadows (25% opacity) */
    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
    --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.15);
    --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.2);

    /* Border Radii */
    --radius-sm: 4px; /* Изменено на 4px */
    --radius-md: 8px;
    --radius-lg: 12px; /* Изменено на 12px */

    /* Базовая система размеров (4px = 1 unit) */
    --spacing-1px: 1px;
    --spacing-2px: 2px;
    --spacing-4px: 4px;
    --spacing-8px: 8px;
    --spacing-12px: 12px;
    --spacing-16px: 16px;
    --spacing-20px: 20px;
    --spacing-24px: 24px;
    --spacing-32px: 32px;
    --spacing-48px: 48px;
    --spacing-64px: 64px;

    /* Типографика */
    --font-size-12px: 12px;
    --font-size-14px: 14px;
    --font-size-16px: 16px;
    --font-size-18px: 18px;
    --font-size-24px: 24px;
    --font-size-32px: 32px;
    --line-height-12px: 16px;
    --line-height-14px: 20px;
    --line-height-16px: 24px;
    --line-height-24px: 32px;

    /* Интерактивные элементы: Кнопки */
    --button-height-small: 28px;
    --button-height-medium: 32px;
    --button-height-large: 40px;
    --button-padding-horizontal-small: 8px;
    --button-padding-horizontal-medium: 12px;
    --button-padding-horizontal-large: 16px;
    --button-border-radius-4px: 4px;
    --button-border-radius-6px: 6px;

    /* Интерактивные элементы: Поля ввода */
    --input-height-32px: 32px;
    --input-height-36px: 36px;
    --input-padding-8px: 8px;
    --input-padding-12px: 12px;
    --input-border-radius-4px: 4px;
    --input-border-width-1px: 1px;
    --input-focus-outline-2px: 2px;

    /* Интерактивные элементы: Чекбоксы и радиокнопки */
    --checkbox-size-16px: 16px;
    --checkbox-text-spacing-8px: 8px;
    --checkbox-border-radius-2px: 2px;

    /* Карточки и контейнеры: Карточки */
    --card-padding-16px: 16px;
    --card-padding-20px: 20px;
    --card-border-radius-8px: 8px;
    --card-border-width-1px: 1px;
    --card-shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);

    /* Карточки и контейнеры: Модальные окна */
    --modal-padding-24px: 24px;
    --modal-border-radius-8px: 8px;
    --modal-border-radius-12px: 12px;
    --modal-min-offset-24px: 24px;

    /* Навигация и меню: Горизонтальная навигация */
    --horizontal-nav-height-48px: 48px;
    --horizontal-nav-height-56px: 56px;
    --horizontal-nav-item-padding-12px: 12px;
    --horizontal-nav-item-spacing-4px: 4px;
    --horizontal-nav-item-spacing-8px: 8px;

    /* Навигация и меню: Боковая навигация */
    --side-nav-width-240px: 240px;
    --side-nav-width-280px: 280px;
    --side-nav-item-height-36px: 36px;
    --side-nav-item-height-40px: 40px;
    --side-nav-item-padding-12px: 12px;
    --side-nav-group-spacing-16px: 16px;

    /* Сетки и списки: Списки */
    --list-item-height-40px: 40px;
    --list-item-height-48px: 48px;
    --list-item-height-56px: 56px;
    --list-item-padding-12px: 12px;
    --list-item-padding-16px: 16px;
    --list-item-spacing-1px: 1px;
    --list-item-spacing-4px: 4px;

    /* Сетки и списки: Таблицы */
    --table-row-height-40px: 40px;
    --table-row-height-48px: 48px;
    --table-cell-padding-8px: 8px;
    --table-cell-padding-12px: 12px;
    --table-header-height-36px: 36px;
    --table-header-height-40px: 40px;

    /* Иконки */
    --icon-size-12px: 12px;
    --icon-size-16px: 16px;
    --icon-size-20px: 20px;
    --icon-size-24px: 24px;
    --icon-size-32px: 32px;

    /* Отступы и компоновка: Внутри компонентов */
    --component-spacing-related-4px: 4px;
    --component-spacing-related-8px: 8px;
    --component-spacing-group-12px: 12px;
    --component-spacing-group-16px: 16px;
    --component-padding-edges-12px: 12px;
    --component-padding-edges-20px: 20px;

    /* Отступы и компоновка: Между компонентами */
    --between-components-tight-8px: 8px;
    --between-components-tight-12px: 12px;
    --between-components-normal-16px: 16px;
    --between-components-normal-24px: 24px;
    --between-sections-32px: 32px;
    --between-sections-48px: 48px;
    --between-main-blocks-64px: 64px;

    /* Адаптивные контейнеры */
    --content-max-width-1200px: 1200px;
    --screen-offset-large-24px: 24px;
    --screen-offset-large-32px: 32px;
    --screen-offset-medium-16px: 16px;
    --screen-offset-medium-20px: 20px;

    /* Размеры основных элементов UI (старые переменные, которые будут заменены) */
    --window-controls-height: var(--horizontal-nav-height-48px); /* Используем новые переменные */
    --toolbar-height: var(--horizontal-nav-height-48px); /* Используем новые переменные */
    --tabbar-height: var(--horizontal-nav-height-48px); /* Используем новые переменные */
    --container-padding: var(--spacing-16px); /* Используем новые переменные */
    --window-controls-width: 188px; /* Пока оставляем как есть, потребуется более детальный расчет */

    /* Цвета для темной темы */
    --accent-color-light: rgba(47, 107, 255, 0.1);
    --accent-color-dark: #1f5bef;
    --btn-bg: transparent;
    --success-color: #27ae60;
    --warning-color: #f39c12;
    --error-color: #e74c3c;
  }

  /* Улучшенные переменные CSS для тёмной темы */
  :global(:root[data-theme='dark']) {
    --bg-primary: #1e1e1e;
    --bg-secondary: #2d2d2d;
    --bg-tertiary: #383838;
    --text-primary: #ffffff;
    --text-secondary: #b3b3b3;
    --border-color: #404040;
    --accent-color: #4c7fff;
    --accent-color-light: rgba(76, 127, 255, 0.2);
    --accent-color-dark: #3d6cff;
    --btn-bg: transparent;
    --btn-bg-hover: #404040;
    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3);
    --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
    --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5);
    --radius-sm: 4px; /* Изменено на 4px */
    --radius-md: 8px;
    --radius-lg: 12px; /* Изменено на 12px */
    --success-color: #2ecc71;
    --warning-color: #f1c40f;
    --error-color: #e67e22;

    /* Размеры кнопок остаются одинаковыми для всех тем */
  }

  /* Стили для phosphor-icons */
  :global(.ph) {
    font-family: 'Phosphor' !important;
    font-style: normal;
    font-weight: normal;
    line-height: 1;
    text-transform: none;
    display: inline-block;
    vertical-align: middle;
  }

  /* Размеры иконок */
  :global(.tab-icon) {
    font-size: var(--icon-size-16px);
    margin-right: var(--spacing-8px);
  }

  :global(.link-icon) {
    font-size: var(--icon-size-24px);
    margin-bottom: var(--spacing-8px);
  }

  :global(.empty-icon) {
    font-size: var(--icon-size-48px); /* 48px - новый размер для крупных иконок */
    margin-bottom: var(--spacing-16px);
    color: var(--text-secondary);
  }

  :global(.bookmark-icon),
  :global(.history-icon) {
    font-size: var(--icon-size-16px);
    margin-right: var(--spacing-16px);
    color: var(--accent-color);
  }

  :global(.feature-icon) {
    font-size: var(--font-size-24px); /* Пример: 1.5rem ~ 24px */
    color: var(--accent-color);
  }

  :global(.ph-check) {
    color: var(--success-color);
    margin-right: var(--spacing-8px);
  }

  /* Сброс стилей */
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :global(body) {
    margin: 0;
    padding: 0;
    overflow: hidden;
  }

  /* Поддержка перетаскивания окна */
  :global(*) {
    -webkit-app-region: no-drag;
  }

  :global(.browser-dragable) {
    -webkit-app-region: drag;
  }

  /* Убираем outline у кнопок */
  :global(button:focus) {
    outline: none;
  }

  /* Плавные переходы */
  :global(*) {
    transition:
      background-color 0.2s ease,
      color 0.2s ease,
      border-color 0.2s ease;
  }

  /* Стили для скроллбаров */
  :global(::-webkit-scrollbar) {
    width: var(--spacing-8px);
    height: var(--spacing-8px);
  }

  :global(::-webkit-scrollbar-track) {
    background: var(--bg-secondary);
  }

  :global(::-webkit-scrollbar-thumb) {
    background: var(--border-color);
    border-radius: var(--radius-sm);
  }

  :global(::-webkit-scrollbar-thumb:hover) {
    background: var(--text-secondary);
  }

  /* Стили для тестовых элементов */
  .test-controls {
    position: fixed;
    bottom: var(--spacing-20px);
    right: var(--spacing-20px);
    z-index: 9999;
  }

  .test-btn {
    display: flex;
    align-items: center;
    gap: var(--spacing-8px);
    padding: var(--spacing-8px) var(--spacing-16px);
    background: var(--accent-color);
    color: white;
    border: none;
    border-radius: var(--button-border-radius-6px);
    font-size: var(--font-size-14px);
    cursor: default;
    transition: background-color 0.2s ease;
  }

  .test-btn:hover {
    background: #1e5ae6;
  }
</style>
