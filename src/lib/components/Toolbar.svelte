<script lang="ts">
  import {
    browserState,
    getActiveTab,
    canGoBack,
    canGoForward,
    navigateBack,
    navigateForward,
    reloadTab,
    navigateToHome,
  } from '../stores/browser.svelte.js';
  import AddressBar from './AddressBar.svelte';

  let currentTab = $state(getActiveTab());

  // Отслеживаем активную вкладку
  $effect(() => {
    currentTab = getActiveTab();
  });

  async function handleBack() {
    if (currentTab) {
      await navigateBack(currentTab.id);
    }
  }

  async function handleForward() {
    if (currentTab) {
      await navigateForward(currentTab.id);
    }
  }

  async function handleReload() {
    if (currentTab) {
      await reloadTab(currentTab.id);
    }
  }

  async function handleHome() {
    if (currentTab) {
      await navigateToHome(currentTab.id);
    }
  }

  function toggleDownloads() {
    browserState.showDownloads = !browserState.showDownloads;
    browserState.showExtensions = false;
    browserState.showBookmarks = false;
    browserState.showHistory = false;
    browserState.showSettings = false;
  }

  function toggleBookmarks() {
    browserState.showBookmarks = !browserState.showBookmarks;
    browserState.showDownloads = false;
    browserState.showExtensions = false;
    browserState.showHistory = false;
    browserState.showSettings = false;
  }

  function toggleHistory() {
    browserState.showHistory = !browserState.showHistory;
    browserState.showBookmarks = false;
    browserState.showDownloads = false;
    browserState.showExtensions = false;
    browserState.showSettings = false;
  }

  function toggleMenu() {
    // Открываем/закрываем выпадающее меню
    browserState.showMainMenu = !browserState.showMainMenu;
    // Закрываем все другие панели
    browserState.showExtensions = false;
    browserState.showDownloads = false;
    browserState.showBookmarks = false;
    browserState.showHistory = false;
    browserState.showSettings = false;
  }

  function openSettings() {
    browserState.showSettings = true;
    browserState.showMainMenu = false;
    browserState.showExtensions = false;
    browserState.showDownloads = false;
    browserState.showBookmarks = false;
    browserState.showHistory = false;
  }

  function openHistory() {
    browserState.showHistory = true;
    browserState.showMainMenu = false;
    browserState.showExtensions = false;
    browserState.showDownloads = false;
    browserState.showBookmarks = false;
    browserState.showSettings = false;
  }

  function openBookmarks() {
    browserState.showBookmarks = true;
    browserState.showMainMenu = false;
    browserState.showExtensions = false;
    browserState.showDownloads = false;
    browserState.showHistory = false;
    browserState.showSettings = false;
  }

  function openDownloads() {
    browserState.showDownloads = true;
    browserState.showMainMenu = false;
    browserState.showExtensions = false;
    browserState.showBookmarks = false;
    browserState.showHistory = false;
    browserState.showSettings = false;
  }

  function showAbout() {
    // TODO: Добавить окно "О приложении"
    alert('Limni v0.1.0\nСовременный интернет-навигатор на базе Tauri v2 + Svelte 5');
    browserState.showMainMenu = false;
  }

  // Закрытие меню при клике вне
  function handleDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const menuContainer = target.closest('.menu-container');
    if (!menuContainer && browserState.showMainMenu) {
      browserState.showMainMenu = false;
    }
  }

  // Добавляем обработчик при монтировании компонента
  $effect(() => {
    if (browserState.showMainMenu) {
      document.addEventListener('click', handleDocumentClick);
    } else {
      document.removeEventListener('click', handleDocumentClick);
    }

    // Очистка при размонтировании
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  });
</script>

<div class="toolbar">
  <!-- Левая секция: только навигация -->
  <div class="left-section">
    <div class="nav-controls">
      <button
        class="nav-btn"
        class:disabled={!currentTab || !canGoBack(currentTab.id)}
        onclick={handleBack}
        disabled={!currentTab || !canGoBack(currentTab.id)}
        title="Назад"
        aria-label="Назад"
      >
        <i class="ph ph-arrow-left"></i>
      </button>

      <button
        class="nav-btn"
        class:disabled={!currentTab || !canGoForward(currentTab.id)}
        onclick={handleForward}
        disabled={!currentTab || !canGoForward(currentTab.id)}
        title="Вперед"
        aria-label="Вперед"
      >
        <i class="ph ph-arrow-right"></i>
      </button>

      <button class="nav-btn" onclick={handleHome} title="Домой" aria-label="Домой">
        <i class="ph ph-house-simple"></i>
      </button>

      <button class="nav-btn" onclick={handleReload} title="Обновить" aria-label="Обновить">
        <i class="ph ph-arrow-clockwise"></i>
      </button>
    </div>
  </div>

  <!-- Центральная секция: Адресная строка -->
  <div class="center-section">
    <AddressBar />
  </div>

  <!-- Правая секция: Расширения, Загрузки, Меню -->
  <div class="right-section">
    <div class="action-controls">
      <!-- Кнопка закладок -->
      <button
        class="action-btn"
        class:active={browserState.showBookmarks}
        onclick={toggleBookmarks}
        title="Закладки"
        aria-label="Закладки"
      >
        <i class="ph ph-star"></i>
      </button>
      <!-- Кнопка истории -->
      <button
        class="action-btn"
        class:active={browserState.showHistory}
        onclick={toggleHistory}
        title="История"
        aria-label="История"
      >
        <i class="ph ph-clock-clockwise"></i>
      </button>
      <!-- Кнопка загрузок -->
      <button
        class="action-btn"
        class:active={browserState.showDownloads}
        onclick={toggleDownloads}
        title="Загрузки"
        aria-label="Загрузки"
      >
        <i class="ph ph-download-simple"></i>
      </button>
      <!-- Меню -->
      <div class="menu-container">
        <button
          class="action-btn menu-burger"
          class:active={browserState.showMainMenu}
          onclick={toggleMenu}
          title="Настройки"
          aria-label="Настройки"
        >
          <i class="ph ph-gear"></i>
        </button>
        {#if browserState.showMainMenu}
          <div class="main-menu-dropdown">
            <button class="menu-item" onclick={openSettings}>
              <i class="ph ph-gear"></i>
              <span>Настройки</span>
            </button>
            <button class="menu-item" onclick={openHistory}>
              <i class="ph ph-clock-clockwise"></i>
              <span>История</span>
            </button>
            <button class="menu-item" onclick={openBookmarks}>
              <i class="ph ph-star"></i>
              <span>Закладки</span>
            </button>
            <button class="menu-item" onclick={openDownloads}>
              <i class="ph ph-download-simple"></i>
              <span>Загрузки</span>
            </button>
            <div class="menu-separator"></div>
            <button class="menu-item" onclick={showAbout}>
              <i class="ph ph-info"></i>
              <span>О приложении</span>
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .toolbar {
    display: flex;
    align-items: center;
    padding: var(--container-padding); /* Делаем одинаковые отступы со всех сторон (6px) */
    background: var(--bg-primary);
    border-bottom: var(--card-border-width-1px) solid var(--border-color);
    height: var(--toolbar-height);
    position: relative;
    z-index: 1000;
    -webkit-app-region: no-drag !important;
    box-sizing: border-box;
  }

  .left-section {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .center-section {
    flex: 1;
    display: flex;
    justify-content: stretch;
    min-width: 200px; /* Минимальная ширина для адресной строки */
    margin: 0 var(--spacing-16px); /* Отступы от левых и правых кнопок */
    transition: all 0.3s ease; /* Плавное изменение ширины */
  }

  .right-section {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .nav-controls {
    display: flex;
    gap: var(--spacing-4px);
    align-items: center;
  }

  .nav-btn {
    width: var(--button-height-medium);
    height: var(--button-height-medium);
    border: none; /* Удаляем обводку */
    background: var(--btn-bg);
    color: var(--text-primary);
    border-radius: var(--button-border-radius-8px);
    cursor: default;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--icon-size-16px);
    transition: all 0.2s ease;
    -webkit-app-region: no-drag !important;
  }

  .nav-btn:hover:not(:disabled) {
    background: var(--btn-bg-hover);
  }

  .nav-btn:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .action-controls {
    display: flex;
    gap: var(--spacing-4px);
    align-items: center;
  }

  .action-btn {
    width: var(--button-height-medium);
    height: var(--button-height-medium);
    border: none; /* Удаляем обводку */
    background: var(--btn-bg);
    color: var(--text-primary);
    border-radius: var(--button-border-radius-8px);
    cursor: default;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--icon-size-16px);
    transition: all 0.2s ease;
    -webkit-app-region: no-drag !important;
  }

  .action-btn:hover {
    background: var(--btn-bg-hover);
  }

  .action-btn.active {
    background: var(--accent-color);
    color: white;
  }

  .menu-burger {
    border: none; /* Удаляем обводку */
    border-radius: var(--button-border-radius-8px); /* Возвращаем квадратную обводку */
    outline: none; /* Убираем outline */
    box-shadow: none; /* Убираем box-shadow */
  }

  .menu-burger:hover {
    border-color: var(--accent-color);
  }

  /* Адаптивность для адресной строки */
  @media (max-width: 768px) {
    .center-section {
      min-width: 120px; /* Уменьшаем минимальную ширину на планшетах */
      margin: 0 var(--spacing-8px); /* Уменьшаем отступы на планшетах */
    }

    .toolbar {
      padding: var(--container-padding) var(--spacing-16px); /* Сохраняем 44px высоту */
    }

    .nav-controls {
      gap: var(--spacing-4px); /* 4px gap согласно сетке */
    }

    .action-controls {
      gap: var(--spacing-4px); /* 4px gap согласно сетке */
    }
  }

  @media (max-width: 480px) {
    .center-section {
      min-width: 96px; /* Минимальная ширина на мобильных, изменено на 96px для 8px сетки */
      margin: 0 var(--spacing-4px); /* Минимальные отступы на мобильных */
    }

    .toolbar {
      padding: var(--container-padding) var(--spacing-12px); /* 12px горизонтальный padding кратно 4px */
    }
  }

  /* Плавные переходы для изменения размеров */
  @media (prefers-reduced-motion: no-preference) {
    .toolbar,
    .center-section {
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); /* Более естественная кривая */
    }
  }

  /* Выпадающее меню */
  .menu-container {
    position: relative;
  }

  .main-menu-dropdown {
    position: absolute;
    top: calc(100% + var(--spacing-8px));
    right: 0;
    min-width: 200px;
    background: var(--bg-primary);
    border: var(--card-border-width-1px) solid var(--border-color);
    border-radius: var(--card-border-radius-8px); /* Было 12px, изменено на 8px для 8px сетки */
    box-shadow: var(--shadow-lg);
    z-index: 1000;
    padding: var(--spacing-8px) 0;
    animation: dropdownFadeIn 0.2s ease-out;
  }

  @keyframes dropdownFadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .menu-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: var(--spacing-8px); /* Было 12px, изменено на 8px для 8px сетки */
    padding: var(--spacing-8px) var(--spacing-16px); /* Было 12px 16px, изменено на 8px 16px для 8px сетки */
    background: none;
    border: none;
    color: var(--text-primary);
    cursor: default;
    font-size: var(--font-size-14px);
    font-weight: 500;
    transition: background-color 0.2s ease;
    text-align: left;
  }

  .menu-item:hover {
    background: var(--btn-bg-hover);
  }

  .menu-item i {
    font-size: var(--icon-size-16px);
    color: var(--text-secondary);
    width: var(--icon-size-16px);
    text-align: center;
  }

  .menu-item:hover i {
    color: var(--accent-color);
  }

  .menu-separator {
    height: var(--spacing-1px);
    background: var(--border-color);
    margin: var(--spacing-8px) var(--spacing-16px); /* Было 8px 12px, изменено на 8px 16px для 8px сетки */
  }
</style>
