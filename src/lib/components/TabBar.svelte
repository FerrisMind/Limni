<!-- src/lib/components/TabBar.svelte -->
<script lang="ts">
  /// <reference types="svelte" />
  /// <reference types="vite/client" />

  import {
    browserState,
    setActiveTab,
    closeTab,
    toggleTabAudio,
    addTab, // Добавлено для Сценария 4.2
    windowState, // Добавлено из WindowControls
  } from '../stores/browser.svelte.js';
  import { getCurrentWindow } from '@tauri-apps/api/window'; // Добавлено из WindowControls

  async function handleTabClick(tabId: string) {
    await setActiveTab(tabId);
  }

  async function handleTabClose(event: MouseEvent, tabId: string) {
    event.stopPropagation();
    await closeTab(tabId);
  }

  async function handleAudioToggle(event: MouseEvent, tabId: string) {
    event.stopPropagation();
    await toggleTabAudio(tabId);
  }

  function getTabTitle(title: string, tabWidth: number): string {
    console.log('🎯 TabBar rendering title:', title, 'width:', tabWidth);
    
    // Адаптивное обрезание заголовка в зависимости от ширины вкладки
    let maxChars;
    if (tabWidth <= 56) {
      maxChars = 0; // Только иконка при минимальной ширине
    } else if (tabWidth <= 80) {
      maxChars = 3;
    } else if (tabWidth <= 120) {
      maxChars = 8;
    } else if (tabWidth <= 160) {
      maxChars = 12;
    } else {
      maxChars = 20;
    }
    
    if (maxChars === 0 || title.length <= maxChars) {
      return maxChars === 0 ? '' : title;
    }
    return title.substring(0, maxChars) + '...';
  }

  // Адаптивная система размеров вкладок по образцу Chromium
  let tabsContainer: HTMLElement;
  let tabWidths = $state<number[]>([]);
  let showScrollButtons = $state(false);
  
  // Константы для адаптивной системы (согласно 4px сетке)
  // Минимальная ширина: фавиконка(16) + отступ(4) + иконка звука(16) + отступ(2) + крестик(16) + отступы по краям(8+8) = 70px
  const TAB_MIN_WIDTH = 72; // Минимальная ширина вкладки (кратно 4px)
  const TAB_MAX_WIDTH = 240; // Максимальная ширина вкладки (кратно 4px) 
  const TAB_THRESHOLD_COUNT = 8; // Количество вкладок для начала сужения
  const NEW_TAB_BUTTON_WIDTH = 28; // Ширина кнопки новой вкладки (кратно 4px)
  const WINDOW_CONTROLS_WIDTH = 168; // Ширина контролов окна
  
  function calculateTabWidths() {
    if (!tabsContainer) return;
    
    const containerWidth = tabsContainer.offsetWidth;
    const tabCount = browserState.tabs.length;
    const availableWidth = containerWidth - NEW_TAB_BUTTON_WIDTH;
    
    if (tabCount === 0) {
      tabWidths = [];
      showScrollButtons = false;
      return;
    }
    
    // Если вкладок мало, используем максимальную ширину
    if (tabCount <= TAB_THRESHOLD_COUNT) {
      const idealWidth = Math.min(TAB_MAX_WIDTH, availableWidth / tabCount);
      tabWidths = new Array(tabCount).fill(Math.max(TAB_MIN_WIDTH, idealWidth));
      showScrollButtons = false;
      return;
    }
    
    // Если вкладок много, рассчитываем адаптивную ширину
    const idealTabWidth = availableWidth / tabCount;
    
    if (idealTabWidth >= TAB_MIN_WIDTH) {
      // Все вкладки помещаются с минимальной шириной или больше
      tabWidths = new Array(tabCount).fill(Math.max(TAB_MIN_WIDTH, idealTabWidth));
      showScrollButtons = false;
    } else {
      // Вкладки не помещаются, включаем прокрутку
      tabWidths = new Array(tabCount).fill(TAB_MIN_WIDTH);
      showScrollButtons = true;
    }
  }
  
  // Пересчитываем размеры при изменении количества вкладок или размера окна
  $effect(() => {
    calculateTabWidths();
  });
  
  $effect(() => {
    if (browserState.tabs.length) {
      calculateTabWidths();
    }
  });

  async function handleNewTabButtonClick() {
    await addTab();
  }

  // Логика WindowControls
  $effect(() => {
    checkMaximized();

    let unsubscribeFn: (() => void) | null = null;

    const setupListener = async () => {
      try {
        const window = getCurrentWindow();
        const unsubscribe = await window.onResized(() => {
          checkMaximized();
        });
        unsubscribeFn = unsubscribe;
      } catch (error) {
        console.error('Error setting up resize listener:', error);
      }
    };

    setupListener();

    return () => {
      if (unsubscribeFn) {
        unsubscribeFn();
      }
    };
  });

  async function checkMaximized() {
    try {
      const window = getCurrentWindow();
      if (windowState) {
        windowState.isMaximized = await window.isMaximized();
      }
    } catch (error) {
      console.error('Error checking window state:', error);
    }
  }

  async function minimizeWindow() {
    try {
      const window = getCurrentWindow();
      await window.minimize();
    } catch (error) {
      console.error('Error minimizing window:', error);
    }
  }

  async function toggleMaximize() {
    try {
      const window = getCurrentWindow();
      if (windowState?.isMaximized) {
        await window.unmaximize();
      } else {
        await window.maximize();
      }
      if (windowState) {
        windowState.isMaximized = !windowState.isMaximized;
      }
    } catch (error) {
      console.error('Error toggling maximize:', error);
    }
  }

  async function closeWindow() {
    try {
      const window = getCurrentWindow();
      await window.close();
    } catch (error) {
      console.error('Error closing window:', error);
    }
  }

  function removeFocus(event: Event) {
    const target = event.target as HTMLElement;
    if (target) {
      target.blur();
    }
  }

  // Функция прокрутки вкладок
  function scrollTabs(direction: 'left' | 'right') {
    if (!tabsContainer) return;
    
    const scrollAmount = 120; // Размер прокрутки (кратно 4px)
    const currentScroll = tabsContainer.scrollLeft;
    
    if (direction === 'left') {
      tabsContainer.scrollTo({
        left: Math.max(0, currentScroll - scrollAmount),
        behavior: 'smooth'
      });
    } else {
      tabsContainer.scrollTo({
        left: currentScroll + scrollAmount,
        behavior: 'smooth'
      });
    }
  }
  
  // Обработчик изменения размера окна
  let resizeObserver: ResizeObserver;
  
  $effect(() => {
    if (tabsContainer) {
      resizeObserver = new ResizeObserver(() => {
        calculateTabWidths();
      });
      resizeObserver.observe(tabsContainer);
      
      return () => {
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
      };
    }
  });

  async function handleDragStart(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.tagName === 'I' || target.closest('button')) {
      return;
    }

    if (event.detail === 2) {
      try {
        await toggleMaximize();
        return;
      } catch (error) {
        console.error('Error toggling maximize:', error);
        return;
      }
    }

    if (event.button === 0) {
      try {
        const window = getCurrentWindow();
        await window.startDragging();
      } catch (error) {
        console.error('Error starting drag:', error);
      }
    }
  }
</script>

<div class="tab-bar" data-tauri-drag-region>
  <!-- Кнопки прокрутки (показываются только при необходимости) -->
  {#if showScrollButtons}
    <button class="scroll-button scroll-left" onclick={() => scrollTabs('left')}>
      <i class="ph ph-caret-left"></i>
    </button>
  {/if}
  
  <!-- Прокручиваемый контейнер только для табов -->
  <div class="tabs-scrollable" data-tauri-drag-region bind:this={tabsContainer}>
    {#each browserState.tabs as tab, index (tab.id)}
      <div 
        class="tab-wrapper" 
        class:active={tab.isActive}
        style="width: {tabWidths[index] || TAB_MIN_WIDTH}px; min-width: {TAB_MIN_WIDTH}px; max-width: {TAB_MAX_WIDTH}px;"
      >
        <button
          class="tab"
          onclick={() => handleTabClick(tab.id)}
          onmousedown={(e: MouseEvent) => {
            if (e.button === 1) {
              // 1 for middle click
              e.preventDefault();
              e.stopPropagation();
              handleTabClose(e, tab.id);
            }
          }}
          type="button"
          aria-label="Переключиться на вкладку: {tab.title}"
        >
          <div class="tab-content">
            <div class="tab-icon-container">
              {#if tab.isLoading}
                <i class="ph ph-circle-notch tab-icon loading"></i>
              {:else if tab.favicon}
                <img
                  src={tab.favicon}
                  alt="Favicon"
                  class="tab-favicon"
                  onerror={(event: Event) => {
                    (event.currentTarget as HTMLImageElement).onerror = null;
                    (event.currentTarget as HTMLImageElement).src = '';
                  }}
                />
              {:else if tab.webviewLabel}
                <i class="ph ph-globe tab-icon"></i>
              {:else}
                <i class="ph ph-file-text tab-icon"></i>
              {/if}
            </div>

            <!-- Заголовок всегда отображается, кроме случая когда на активной вкладке есть аудио -->
            {#if !(tab.hasAudio && tab.isActive)}
              <span class="tab-title">{getTabTitle(tab.title, tabWidths[index] || TAB_MIN_WIDTH)}</span>
            {/if}
            
            <!-- Кнопка динамика в фиксированной позиции -->
            {#if tab.hasAudio}
              <button
                class="audio-toggle"
                class:visible={tabWidths[index] >= TAB_MIN_WIDTH || tab.isActive}
                onclick={(e) => handleAudioToggle(e, tab.id)}
                title={tab.isAudioMuted ? 'Включить звук' : 'Отключить звук'}
                aria-label={tab.isAudioMuted ? 'Включить звук' : 'Отключить звук'}
              >
                {#if tab.isAudioMuted}
                  <i class="ph ph-speaker-simple-slash"></i>
                {:else}
                  <i class="ph ph-speaker-simple-high"></i>
                {/if}
              </button>
            {/if}
          </div>
        </button>



        {#if tabWidths[index] > 100 || tab.isActive}
          <!-- Для активной вкладки крестик всегда виден -->
          <button
            class="tab-close"
            onclick={(e) => handleTabClose(e, tab.id)}
            type="button"
            aria-label="Закрыть вкладку: {tab.title}"
          >
            <i class="ph ph-x"></i>
          </button>
        {/if}
      </div>
    {/each}

    <!-- Пустое пространство также draggable -->
    <div class="empty-space" data-tauri-drag-region></div>
  </div>
  
  {#if showScrollButtons}
    <button class="scroll-button scroll-right" onclick={() => scrollTabs('right')}>
      <i class="ph ph-caret-right"></i>
    </button>
  {/if}

  <!-- Кнопка добавления новой вкладки (Сценарий 4.2) -->
  <button
    class="new-tab-button"
    onclick={handleNewTabButtonClick}
    type="button"
    aria-label="Новая вкладка"
  >
    <i class="ph ph-plus"></i>
  </button>

  <!-- Контролы окна -->
  <div class="window-controls-container" onmousedown={handleDragStart} role="presentation">
    <button
      class="control-btn minimize"
      onclick={(e) => {
        minimizeWindow();
        removeFocus(e);
      }}
      title="Свернуть"
      aria-label="Свернуть окно"
    >
      <i class="ph ph-minus"></i>
    </button>

    <button
      class="control-btn maximize"
      onclick={(e) => {
        toggleMaximize();
        removeFocus(e);
      }}
      title={windowState?.isMaximized ? 'Восстановить' : 'Развернуть'}
      aria-label={windowState?.isMaximized ? 'Восстановить окно' : 'Развернуть окно'}
    >
      {#if windowState?.isMaximized}
        <i class="ph ph-copy"></i>
      {:else}
        <i class="ph ph-square"></i>
      {/if}
    </button>

    <button
      class="control-btn close"
      onclick={(e) => {
        closeWindow();
        removeFocus(e);
      }}
      title="Закрыть"
      aria-label="Закрыть окно"
    >
      <i class="ph ph-x"></i>
    </button>
  </div>
</div>

<style lang="scss">
  .tab-bar {
    display: flex;
    align-items: center;
    height: var(--tabbar-height); /* Высота таббара */
    background-color: var(--bg-primary);
    padding-left: var(--spacing-4px); /* Добавлен отступ слева для табов, сдвинут на 4px левее */
    padding-right: var(--spacing-4px); /* Уменьшено с 8px до 4px */
    gap: var(--spacing-4px); /* Уменьшено с 8px до 4px для компактности */
    overflow: hidden;
    border-bottom: var(--card-border-width-1px) solid var(--border-color);

    .tabs-scrollable {
      display: flex;
      flex-grow: 1; /* Занимает все доступное пространство */
      overflow-x: auto; /* Позволяет прокручивать табы */
      gap: var(--spacing-2px); /* Уменьшено с 4px до 2px для компактности */
      margin-right: var(--window-controls-width); /* Резервируем место под WindowControls справа */
      -webkit-overflow-scrolling: touch; /* Улучшенная прокрутка на touch-устройствах */
      scrollbar-width: none; /* Скрываем стандартный скроллбар Firefox */
      scroll-behavior: smooth; /* Плавная прокрутка */
      &::-webkit-scrollbar {
        display: none; /* Скрываем скроллбар WebKit */
      }
    }
    
    /* Стили для кнопок прокрутки */
    .scroll-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: var(--spacing-24px); /* 24px согласно 4px сетке */
      height: 100%;
      background: transparent; /* Убираем серый фон */
      border: none;
      color: var(--text-secondary);
      cursor: default;
      font-size: var(--icon-size-16px); /* Приведено к размеру иконок тулбара */
      flex-shrink: 0;
      
      /* Ховер только для иконки каретки */
      i {
        transition: color 0.2s ease;
        padding: var(--spacing-4px);
        border-radius: var(--radius-sm);
        
        &:hover {
          color: var(--text-primary);
        }
      }
      
      /* Убираем видимые границы с боковых сторон */
    }

    .tab-wrapper {
      flex-shrink: 1; /* Разрешаем сжатие вкладок для адаптивности */
      display: flex;
      align-items: center;
      padding: 0 var(--spacing-4px); /* Уменьшено до 4px согласно 4px сетке */
      height: 100%;
      border-right: var(--card-border-width-1px) solid var(--border-color);
      border-radius: var(
        --card-border-radius-8px
      ); /* Скругляем углы обертки таба, теперь соответствует 8px сетке */
      transition: all 0.2s ease; /* Плавный переход для всех свойств */
      overflow: hidden; /* Скрываем переполнение для корректного отображения */

      &.active {
        background-color: var(--bg-secondary);
        /* border-bottom: 4px solid var(--accent-color); */ /* Убираем синюю полосу */
        margin-bottom: 0; /* Компенсируем границу */
        border-radius: var(
          --card-border-radius-8px
        ); /* Верхние углы скруглены, нижние прямые, теперь соответствует 8px сетке */

        .tab-close {
          opacity: 1; /* Кнопка закрытия всегда видима на активной вкладке */
          pointer-events: auto;
        }
      }

      &:not(.active) {
        .tab-close {
          opacity: 0; /* Скрываем крестик на неактивных табах */
          pointer-events: none; /* Отключаем события указателя */
          transition: opacity 0.2s ease; /* Плавное появление */
        }

        &:hover {
          background-color: var(
            --bg-secondary
          ); /* Цвет фона ховера неактивного таба как у активного */
          .tab-close {
            opacity: 1; /* Показываем крестик при наведении на неактивный таб */
            pointer-events: auto;
          }
        }
      }
    }

    .tab {
      display: flex;
      align-items: center;
      padding: 0 var(--spacing-8px); /* Внутренние отступы таба согласно 8px сетке */
      height: var(--button-height-medium); /* Высота таба согласно 8px сетке */
      background: none;
      border: none;
      cursor: default;
      color: var(--text-primary);
      font-size: var(--font-size-14px);
      user-select: none;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 100%; /* Занимает всю доступную ширину wrapper'а */
      min-width: 0; /* Позволяет сжиматься */
      border-radius: var(
        --card-border-radius-8px
      ); /* Скругляем углы самого таба, теперь соответствует 8px сетке */

      /* Удаляем общий hover, теперь он управляется .tab-wrapper */
      /*
      &:hover {
        background-color: var(--btn-bg-hover);
      }
      */

      .tab-content {
        display: flex;
        align-items: center;
        gap: var(--spacing-4px); /* Уменьшено расстояние между элементами до 4px */
        min-width: 0; /* Для правильного обрезания текста */
        width: 100%;
      }

      .tab-icon-container {
        width: var(--icon-size-16px);
        height: var(--icon-size-16px);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        .tab-favicon {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .tab-icon {
          font-size: var(--icon-size-16px);
          &.loading {
            animation: spin 1s linear infinite;
          }
        }
      }

      .tab-title {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        min-width: 0; /* Позволяет сжиматься до минимума */
        font-weight: 400;
        line-height: 1.2;
      }

    .tab-favicon {
      width: var(--spacing-16px); /* Фиксированная ширина согласно 4px сетке */
      height: var(--spacing-16px); /* Фиксированная высота согласно 4px сетке */
      flex-shrink: 0; /* Не сжимается */
      object-fit: contain;
      border-radius: var(--spacing-2px); /* Небольшое скругление */
    }

    .tab-content {
      display: flex;
      align-items: center;
      width: 100%;
      min-width: 0;
      gap: var(--spacing-4px); /* Отступ между элементами согласно 4px сетке */
    }

    .tab-icon-container {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: var(--spacing-16px);
      height: var(--spacing-16px);
    }

    .tab-icon {
      width: var(--spacing-16px);
      height: var(--spacing-16px);
      font-size: var(--icon-size-12px);
      color: var(--text-secondary);
      flex-shrink: 0;
    }

    .tab-icon.loading {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    }

    .audio-toggle {
      background: none;
      border: none;
      cursor: default;
      color: var(--text-secondary);
      font-size: var(--icon-size-12px);
      padding: var(--spacing-2px);
      border-radius: var(--radius-sm);
      width: var(--spacing-16px);
      height: var(--spacing-16px);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.2s ease;
      opacity: 0;
      pointer-events: none;

      &.visible {
        opacity: 1;
        pointer-events: auto;
      }

      &:hover {
        background-color: var(--btn-bg-hover);
      }
    }

    .tab-close {
      background: none;
      border: none;
      cursor: default;
      color: var(--text-secondary);
      font-size: var(--icon-size-12px);
      padding: var(--spacing-2px);
      border-radius: var(--radius-sm);
      margin-left: var(--spacing-4px);
      width: var(--spacing-16px);
      height: var(--spacing-16px);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.2s ease;

      &:hover {
        background-color: var(--btn-bg-hover);
        color: var(--error-color);
      }
    }

    .new-tab-button {
      background-color: var(--bg-secondary); /* Цвет фона кнопки */
      border: var(--card-border-width-1px) solid var(--border-color); /* Круглая обводка */
      cursor: default;
      color: var(--text-secondary);
      font-size: var(--icon-size-12px); /* Уменьшено с 16px до 12px */
      width: var(--icon-size-20px); /* Уменьшено с 24px до 20px */
      height: var(--icon-size-20px); /* Уменьшено с 24px до 20px */
      border-radius: 50%; /* Делаем круглым */
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      &:hover {
        background-color: var(--btn-bg-hover);
      }
    }
  }

  /* Стили для WindowControls, перенесенные из WindowControls.svelte */
  .window-controls-container {
    display: flex !important;
    align-items: center;
    height: var(
      --window-controls-height
    ); /* Устанавливаем высоту тулбара в соответствии с переменной */
    z-index: 1001;
    gap: var(--spacing-4px); /* Уменьшено с 8px до 4px */
    background: rgba(0, 0, 0, 0);
    padding: var(--container-padding);
    margin-left: 36px;
    margin-right: -4px; /* Выравниваем с правой секцией тулбара */
    border-radius: var(--button-border-radius-8px);
    backdrop-filter: blur(100px);
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    user-select: none;
    -webkit-app-region: drag; /* Делаем область перетаскиваемой */

    /* Удаляем лишние элементы из переносимого HTML */
  }

  .control-btn {
    width: var(--button-height-medium);
    height: var(--button-height-medium);
    border: none; /* Убеждаемся, что обводки нет */
    background: none; /* Убираем фон */
    color: var(--text-secondary, #667085);
    cursor: default;
    display: flex !important;
    align-items: center;
    justify-content: center;
    font-size: var(--icon-size-16px);
    border-radius: var(--button-border-radius-8px); /* Возвращаем скругление для самой кнопки */
    transition: all 0.2s ease;
    opacity: 1;
    visibility: visible;
    -webkit-app-region: no-drag !important;
    pointer-events: auto !important;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    outline: none; /* Убираем outline */
    box-shadow: none; /* Убираем box-shadow */
  }

  .control-btn:hover {
    background: var(--btn-bg-hover);
    color: var(--text-primary);
    border-radius: var(--button-border-radius-4px); /* Делаем ховер скругленным согласно 4px сетке */
  }

  .control-btn.close:hover {
    background: #e74c3c;
    color: white;
  }

  .control-btn.minimize:hover {
    background: #27ae60;
    color: white;
  }

  .control-btn.maximize:hover {
    background: #f39c12;
    color: white;
  }

  /* Стили для иконок Phosphor внутри WindowControls */
  .window-controls-container .ph {
    font-family: 'Phosphor' !important;
    font-style: normal;
    font-weight: normal;
    line-height: 1;
    display: inline-block;
    vertical-align: middle;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .window-controls-container i {
    opacity: 1 !important;
    visibility: visible !important;
    display: inline-block !important;
    -webkit-app-region: no-drag !important;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>
