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
  } from '../stores/browser.svelte.js';

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
</div>

<style lang="scss">
  .tab-bar {
    display: flex;
    align-items: center;
    height: 44px; /* Высота таббара */
    background-color: var(--bg-primary);
    padding-right: 8px; /* Отступ справа для кнопки "+" */
    gap: 2px;
    overflow: hidden;
    border-bottom: 1px solid var(--border-color);

    .tabs-scrollable {
      display: flex;
      flex-grow: 1; /* Занимает все доступное пространство */
      overflow-x: auto; /* Позволяет прокручивать табы */
      -webkit-overflow-scrolling: touch; /* Улучшенная прокрутка на touch-устройствах */
      scrollbar-width: none; /* Скрываем стандартный скроллбар Firefox */
      margin-right: var(--window-controls-width); /* Резервируем место под WindowControls справа */
      &::-webkit-scrollbar {
        display: none; /* Скрываем скроллбар WebKit */
      }
    }

    .tab-wrapper {
      flex-shrink: 0; /* Табы не сжимаются */
      display: flex;
      align-items: center;
      padding: 0 4px; /* Отступы вокруг кнопки закрытия и иконки звука */
      height: 100%;
      border-right: 1px solid var(--border-color);

      &.active {
        background-color: var(--bg-secondary);
        border-bottom: 2px solid var(--accent-color); /* Акцент для активной вкладки */
        margin-bottom: -1px; /* Компенсируем границу */
      }
    }

    .tab {
      display: flex;
      align-items: center;
      gap: 8px; /* Расстояние между иконкой/фавиконом и заголовком */
      padding: 0 12px; /* Внутренние отступы таба */
      height: 100%;
      background: none;
      border: none;
      cursor: default;
      color: var(--text-primary);
      font-size: 14px;
      user-select: none;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 304px; /* Ограничение ширины таба */

      &:hover {
        background-color: var(--btn-bg-hover);
      }

      .tab-content {
        display: flex;
        align-items: center;
        min-width: 0; /* Для правильного обрезания текста */
      }

      .tab-icon-container {
        width: 16px;
        height: 16px;
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
          font-size: 16px;
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
      font-size: 14px;
      padding: 4px;
      border-radius: 4px;
      margin-left: -4px; /* Смещаем ближе к тексту */

      &:hover {
        background-color: var(--btn-bg-hover);
      }
    }

    .tab-close {
      background: none;
      border: none;
      cursor: default;
      color: var(--text-secondary);
      font-size: 14px;
      padding: 4px;
      border-radius: 4px;
      margin-left: 4px; /* Отступ от заголовка */

      &:hover {
        background-color: var(--btn-bg-hover);
      }
    }

    .new-tab-button {
      background: none;
      border: none;
      cursor: default;
      color: var(--text-secondary);
      font-size: 20px; /* Больший размер для иконки плюса */
      width: 32px;
      height: 32px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      &:hover {
        background-color: var(--btn-bg-hover);
      }
    }
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
