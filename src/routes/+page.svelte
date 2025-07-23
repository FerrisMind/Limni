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
  import WindowControls from '../lib/components/WindowControls.svelte';
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
  <WindowControls />
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
  :global(:root) {
    --bg-primary: #f9f9fc;
    --bg-secondary: #ffffff;
    --bg-tertiary: #f5f5f7;
    --text-primary: #1f2328;
    --text-secondary: #667085;
    --border-color: #dadde6;
    --accent-color: #2f6bff;
    --accent-color-light: rgba(47, 107, 255, 0.1);
    --accent-color-dark: #1f5bef;
    --btn-bg: transparent;
    --btn-bg-hover: #e8e8e8;
    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
    --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.15);
    --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.2);
    --radius-sm: 8px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --success-color: #27ae60;
    --warning-color: #f39c12;
    --error-color: #e74c3c;

    /* Единообразная система кнопок с сеткой 44px */
    --btn-size-primary: 44px; /* Основной размер кнопок для touch targets (WCAG) */
    --btn-size-secondary: 40px; /* Вторичный размер для компактных кнопок */
    --btn-size-small: 36px; /* Малый размер для мелких элементов */
    --btn-border-radius: 8px; /* Единообразное скругление кнопок */
    --btn-icon-size: 16px; /* Стандартный размер иконок в кнопках */
    --btn-font-size: 14px; /* Стандартный размер шрифта в кнопках */

    /* Единообразная система отступов (сетка 4px) */
    --spacing-xxs: 8px; /* Очень маленький отступ */
    --spacing-xs: 4px; /* Минимальный отступ */
    --spacing-sm: 8px; /* Малый отступ */
    --spacing-md: 12px; /* Средний отступ */
    --spacing-lg: 16px; /* Большой отступ */
    --spacing-xl: 24px; /* Очень большой отступ */

    /* Высоты контейнеров */
    --window-controls-height: 40px;
    --toolbar-height: 44px;
    --tabbar-height: 44px;
    --container-padding: 4px; /* (44px - 36px content) / 2 для центрирования */

    /* Ширина WindowControls для резервирования места */
    --window-controls-width: 188px; /* new-tab-btn(24) + gaps(16) + spacer(36) + buttons(108) + padding(4) */
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
    --radius-sm: 8px;
    --radius-md: 8px;
    --radius-lg: 12px;
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
    font-size: 16px;
    margin-right: var(--spacing-sm);
  }

  :global(.link-icon) {
    font-size: 24px;
    margin-bottom: var(--spacing-sm);
  }

  :global(.empty-icon) {
    font-size: 48px;
    margin-bottom: var(--spacing-lg);
    color: var(--text-secondary);
  }

  :global(.bookmark-icon),
  :global(.history-icon) {
    font-size: 16px;
    margin-right: var(--spacing-md);
    color: var(--accent-color);
  }

  :global(.feature-icon) {
    font-size: 1.5rem;
    color: var(--accent-color);
  }

  :global(.ph-check) {
    color: #10b981;
    margin-right: var(--spacing-sm);
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
    width: 8px;
    height: 8px;
  }

  :global(::-webkit-scrollbar-track) {
    background: var(--bg-secondary);
  }

  :global(::-webkit-scrollbar-thumb) {
    background: var(--border-color);
    border-radius: 4px;
  }

  :global(::-webkit-scrollbar-thumb:hover) {
    background: var(--text-secondary);
  }

  /* Стили для тестовых элементов */
  .test-controls {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
  }

  .test-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: var(--accent-color);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    cursor: default;
    transition: background-color 0.2s ease;
  }

  .test-btn:hover {
    background: #1e5ae6;
  }
</style>
