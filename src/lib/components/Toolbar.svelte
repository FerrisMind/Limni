<script lang="ts">
  import { 
    browserState, 
    getActiveTab, 
    canGoBack, 
    canGoForward,
    navigateBack,
    navigateForward,
    reloadTab,
    updateTabUrl
  } from '../stores/browser.svelte.js';

  let currentTab = $state(getActiveTab());
  let addressBarUrl = $state('');

  // Отслеживаем активную вкладку
  $effect(() => {
    currentTab = getActiveTab();
    if (currentTab) {
      addressBarUrl = currentTab.url === 'about:blank' ? '' : currentTab.url;
    }
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

  async function handleNavigate() {
    if (!currentTab || !addressBarUrl.trim()) return;

    let url = addressBarUrl.trim();
    
    // Проверяем, является ли ввод URL или поисковым запросом
    if (!url.includes('.') || (!url.startsWith('http://') && !url.startsWith('https://'))) {
      // Если это поисковый запрос, используем Google
      url = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
    } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
      // Добавляем https:// если протокол не указан
      url = `https://${url}`;
    }

    await updateTabUrl(currentTab.id, url);
  }

  function handleAddressBarKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      handleNavigate();
    }
  }



  function toggleExtensions() {
    browserState.showExtensions = !browserState.showExtensions;
    browserState.showDownloads = false;
    browserState.showBookmarks = false;
    browserState.showHistory = false;
    browserState.showSettings = false;
  }

  function toggleDownloads() {
    browserState.showDownloads = !browserState.showDownloads;
    browserState.showExtensions = false;
    browserState.showBookmarks = false;
    browserState.showHistory = false;
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

  function openExtensions() {
    browserState.showExtensions = true;
    browserState.showMainMenu = false;
    browserState.showDownloads = false;
    browserState.showBookmarks = false;
    browserState.showHistory = false;
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
      
      <button class="nav-btn" onclick={handleReload} title="Обновить" aria-label="Обновить">
        <i class="ph ph-arrow-clockwise"></i>
      </button>
    </div>
  </div>

  <!-- Центральная секция: Адресная строка -->
  <div class="center-section">
    <div class="address-bar">
      <div class="address-input-container">
        <div class="address-icon">
          <i class="ph ph-globe"></i>
        </div>
        <input
          type="text"
          class="address-input"
          bind:value={addressBarUrl}
          onkeydown={handleAddressBarKeydown}
          placeholder="Поиск в Google или введите URL"
        />
        <button class="go-btn" onclick={handleNavigate} title="Перейти" aria-label="Перейти">
          <i class="ph ph-arrow-right"></i>
        </button>
      </div>
    </div>
  </div>

  <!-- Правая секция: Расширения, Загрузки, Меню -->
  <div class="right-section">
    <div class="action-controls">
      <button 
        class="action-btn"
        class:active={browserState.showExtensions}
        onclick={toggleExtensions}
        title="Расширения"
        aria-label="Расширения"
      >
        <i class="ph ph-puzzle-piece"></i>
      </button>
      
      <button 
        class="action-btn"
        class:active={browserState.showDownloads}
        onclick={toggleDownloads}
        title="Загрузки"
        aria-label="Загрузки"
      >
        <i class="ph ph-download-simple"></i>
      </button>
      
      <div class="menu-container">
        <button 
          class="action-btn menu-burger"
          class:active={browserState.showMainMenu}
          onclick={toggleMenu}
          title="Меню"
          aria-label="Меню"
        >
          <i class="ph ph-list"></i>
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
            
            <button class="menu-item" onclick={openExtensions}>
              <i class="ph ph-puzzle-piece"></i>
              <span>Расширения</span>
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
    border-bottom: 1px solid var(--border-color);
    height: var(--toolbar-height);
    position: relative;
    z-index: 1000;
    gap: var(--spacing-md);
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
    justify-content: center;
    min-width: 200px; /* Минимальная ширина для адресной строки */
    transition: all 0.3s ease; /* Плавное изменение ширины */
  }

  .right-section {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }



  .nav-controls {
    display: flex;
    gap: var(--spacing-xs);
    align-items: center;
  }

  .nav-btn {
    width: var(--btn-size-small);
    height: var(--btn-size-small);
    border: none; /* Удаляем обводку */
    background: var(--btn-bg);
    color: var(--text-primary);
    border-radius: var(--btn-border-radius);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--btn-icon-size);
    transition: all 0.2s ease;
    -webkit-app-region: no-drag !important;
  }

  .nav-btn:hover:not(:disabled) {
    background: var(--btn-bg-hover);
  }

  .nav-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .address-bar {
    width: 100%;
    max-width: none; /* Убираем ограничение для полной гибкости */
    transition: width 0.3s ease; /* Плавное изменение ширины */
  }

  .address-input-container {
    display: flex;
    align-items: center;
    border: 1px solid var(--border-color);
    border-radius: var(--btn-border-radius);
    overflow: hidden;
    background: var(--bg-secondary);
    transition: all 0.3s ease;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    height: var(--btn-size-small);
    -webkit-app-region: no-drag !important;
  }

  .address-input-container:focus-within {
    border-color: var(--accent-color);
    box-shadow: 0 2px 12px rgba(47, 107, 255, 0.2);
  }

  .address-icon {
    padding: 0 var(--spacing-md);
    color: var(--text-secondary);
    font-size: var(--btn-icon-size);
    display: flex;
    align-items: center;
    -webkit-app-region: no-drag !important;
  }

  .address-input {
    flex: 1;
    border: none;
    background: transparent;
    padding: 10px var(--spacing-sm);
    color: var(--text-primary);
    font-size: var(--btn-font-size);
    outline: none;
    font-family: inherit;
    transition: all 0.3s ease;
    -webkit-app-region: no-drag !important;
  }

  .address-input::placeholder {
    color: var(--text-secondary);
  }

  .go-btn {
    border: none; /* Удаляем обводку */
    background: var(--accent-color);
    color: white;
    padding: 10px var(--spacing-lg);
    cursor: pointer;
    font-size: var(--btn-font-size);
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0 var(--btn-border-radius) var(--btn-border-radius) 0;
    -webkit-app-region: no-drag !important;
  }

  .go-btn:hover {
    background: #1f5bef;
  }

  .action-controls {
    display: flex;
    gap: var(--spacing-xs);
    align-items: center;
  }

  .action-btn {
    width: var(--btn-size-small);
    height: var(--btn-size-small);
    border: none; /* Удаляем обводку */
    background: var(--btn-bg);
    color: var(--text-primary);
    border-radius: var(--btn-border-radius);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--btn-icon-size);
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

  .action-btn:active {
  }

  .menu-burger {
    border: none; /* Удаляем обводку */
    border-radius: var(--btn-border-radius); /* Возвращаем квадратную обводку */
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
    }
    
    .toolbar {
      gap: var(--spacing-sm); /* 8px gap кратно 4px для планшетов */
      padding: var(--container-padding) var(--spacing-lg); /* Сохраняем 44px высоту */
    }
    
    .nav-controls {
      gap: var(--spacing-xs); /* 4px gap согласно сетке */
    }
    
    .action-controls {
      gap: var(--spacing-xs); /* 4px gap согласно сетке */
    }
  }
  
  @media (max-width: 480px) {
    .center-section {
      min-width: 100px; /* Минимальная ширина на мобильных */
    }
    
    .toolbar {
      gap: var(--spacing-sm); /* 8px gap согласно сетке */
      padding: var(--container-padding) var(--spacing-md); /* 12px горизонтальный padding кратно 4px */
    }
  }
  
  /* Плавные переходы для изменения размеров */
  @media (prefers-reduced-motion: no-preference) {
    .toolbar,
    .center-section,
    .address-bar,
    .address-input-container,
    .address-input {
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); /* Более естественная кривая */
    }
  }

  /* Выпадающее меню */
  .menu-container {
    position: relative;
  }

  .main-menu-dropdown {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    min-width: 200px;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    z-index: 1000;
    padding: 8px 0;
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
    gap: 12px;
    padding: 12px 16px;
    background: none;
    border: none;
    color: var(--text-primary);
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: background-color 0.2s ease;
    text-align: left;
  }

  .menu-item:hover {
    background: var(--btn-bg-hover);
  }

  .menu-item i {
    font-size: 16px;
    color: var(--text-secondary);
    width: 16px;
    text-align: center;
  }

  .menu-item:hover i {
    color: var(--accent-color);
  }

  .menu-separator {
    height: 1px;
    background: var(--border-color);
    margin: 8px 12px;
  }

  /* Закрытие меню при клике вне */
</style> 