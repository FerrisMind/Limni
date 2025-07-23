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

  function getTabTitle(title: string): string {
    console.log('🎯 TabBar rendering title:', title);
    if (title.length > 16) {
      /* Уменьшаем с 20 до 16 символов */
      return title.substring(0, 16) + '...';
    }
    return title;
  }

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
  <!-- Прокручиваемый контейнер только для табов -->
  <div class="tabs-scrollable" data-tauri-drag-region>
    {#each browserState.tabs as tab (tab.id)}
      <div class="tab-wrapper" class:active={tab.isActive}>
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

            <span class="tab-title">{getTabTitle(tab.title)}</span>
          </div>
        </button>

        {#if tab.hasAudio}
          <button
            class="audio-toggle"
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

        <button
          class="tab-close"
          onclick={(e) => handleTabClose(e, tab.id)}
          type="button"
          aria-label="Закрыть вкладку: {tab.title}"
        >
          <i class="ph ph-x"></i>
        </button>
      </div>
    {/each}

    <!-- Пустое пространство также draggable -->
    <div class="empty-space" data-tauri-drag-region></div>
  </div>

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
    padding-right: var(--spacing-8px); /* Отступ справа для кнопки "+" */
    gap: var(--spacing-8px); /* Теперь соответствует 8px сетке */
    overflow: hidden;
    border-bottom: var(--card-border-width-1px) solid var(--border-color);

    .tabs-scrollable {
      display: flex;
      flex-grow: 1; /* Занимает все доступное пространство */
      overflow-x: auto; /* Позволяет прокручивать табы */
      gap: var(--spacing-4px); /* Расстояние между табами */
      margin-right: var(--window-controls-width); /* Резервируем место под WindowControls справа */
      -webkit-overflow-scrolling: touch; /* Улучшенная прокрутка на touch-устройствах */
      scrollbar-width: none; /* Скрываем стандартный скроллбар Firefox */
      &::-webkit-scrollbar {
        display: none; /* Скрываем скроллбар WebKit */
      }
    }

    .tab-wrapper {
      flex-shrink: 0; /* Табы не сжимаются */
      display: flex;
      align-items: center;
      padding: 0 var(--spacing-8px); /* Отступы вокруг кнопки закрытия и иконки звука, теперь соответствует 8px сетке */
      height: 100%;
      border-right: var(--card-border-width-1px) solid var(--border-color);
      border-radius: var(--card-border-radius-8px); /* Скругляем углы обертки таба, теперь соответствует 8px сетке */
      transition: background-color 0.2s ease; /* Добавим плавный переход */

      &.active {
        background-color: var(--bg-secondary);
        /* border-bottom: 4px solid var(--accent-color); */ /* Убираем синюю полосу */
        margin-bottom: 0; /* Компенсируем границу */
        border-radius: var(--card-border-radius-8px); /* Верхние углы скруглены, нижние прямые, теперь соответствует 8px сетке */

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
          background-color: var(--bg-secondary); /* Цвет фона ховера неактивного таба как у активного */
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
      /* gap: 12px; */ /* Увеличено расстояние между иконкой/фавиконом и заголовком */
      padding: 0 var(--spacing-8px); /* Внутренние отступы таба: уменьшен левый padding для сдвига фавиконки влево, теперь соответствует 8px сетке */
      height: var(--button-height-medium); /* Высота таба, теперь соответствует 8px сетке */
      background: none;
      border: none;
      cursor: default;
      color: var(--text-primary);
      font-size: var(--font-size-14px);
      user-select: none;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 304px; /* Ограничение ширины таба */
      border-radius: var(--card-border-radius-8px); /* Скругляем углы самого таба, теперь соответствует 8px сетке */
      

      /* Удаляем общий hover, теперь он управляется .tab-wrapper */
      /*
      &:hover {
        background-color: var(--btn-bg-hover);
      }
      */

      .tab-content {
        display: flex;
        align-items: center;
        gap: 8px; /* Расстояние между иконкой/фавиконом и заголовком, теперь соответствует 8px сетке */
        min-width: 0; /* Для правильного обрезания текста */
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
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .audio-toggle {
      background: none;
      border: none;
      cursor: default;
      color: var(--text-secondary);
      font-size: var(--font-size-14px);
      padding: var(--spacing-8px); /* Теперь соответствует 8px сетке */
      border-radius: var(--card-border-radius-8px); /* Скругляем углы кнопки звука, теперь соответствует 8px сетке */
      margin-left: calc(-1 * var(--spacing-8px)); /* Смещаем ближе к тексту, теперь соответствует 8px сетке */

      &:hover {
        background-color: var(--btn-bg-hover);
      }
    }

    .tab-close {
      background: none;
      border: none;
      cursor: default;
      color: var(--text-secondary);
      font-size: var(--font-size-14px);
      padding: var(--spacing-8px); /* Теперь соответствует 8px сетке */
      border-radius: var(--card-border-radius-8px); /* Скругляем углы кнопки закрытия, теперь соответствует 8px сетке */
      margin-left: var(--spacing-8px); /* Отступ от заголовка, теперь соответствует 8px сетке */

      &:hover {
        background-color: var(--btn-bg-hover);
      }
    }

    .new-tab-button {
      background-color: var(--bg-secondary); /* Цвет фона кнопки */
      border: var(--card-border-width-1px) solid var(--border-color); /* Круглая обводка */
      cursor: default;
      color: var(--text-secondary);
      font-size: var(--icon-size-16px); /* Уменьшаем размер иконки плюса */
      width: var(--icon-size-24px); /* Уменьшаем ширину */
      height: var(--icon-size-24px); /* Уменьшаем высоту */
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
    height: var(--window-controls-height); /* Устанавливаем высоту тулбара в соответствии с переменной */
    z-index: 1001;
    gap: var(--spacing-8px);
    background: rgba(0, 0, 0, 0);
    padding: var(--container-padding);
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
    border-radius: var(--button-border-radius-8px); /* Делаем ховер скругленным */
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
