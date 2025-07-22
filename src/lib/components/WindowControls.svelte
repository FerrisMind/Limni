<script lang="ts">
  import { getCurrentWindow } from '@tauri-apps/api/window';
  import { addTab, windowState } from '../stores/browser.svelte.js';

  // Проверяем состояние окна при загрузке и подписываемся на изменения
  $effect(() => {
    checkMaximized();

    // Подписываемся на события изменения размера окна с задержкой
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

  async function handleNewTab() {
    await addTab();
  }

  // Функция для снятия фокуса с кнопки после клика
  function removeFocus(event: Event) {
    const target = event.target as HTMLElement;
    if (target) {
      target.blur();
    }
  }

  // Программное перетаскивание для контейнера
  async function handleDragStart(event: MouseEvent) {
    // Проверяем что клик не по кнопке
    const target = event.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.tagName === 'I' || target.closest('button')) {
      return; // Игнорируем клики по кнопкам
    }

    // Двойной клик - максимизация/восстановление окна
    if (event.detail === 2) {
      try {
        await toggleMaximize();
        return;
      } catch (error) {
        console.error('Error toggling maximize:', error);
        return;
      }
    }

    // Одинарный клик - перетаскивание
    if (event.button === 0) {
      // Левая кнопка мыши
      try {
        const window = getCurrentWindow();
        await window.startDragging();
      } catch (error) {
        console.error('Error starting drag:', error);
      }
    }
  }

  // Простые функции без сложных обработчиков событий
</script>

<!-- Защитная зона против draggable -->
<div class="no-drag-zone"></div>

<!-- Максимальная защита: перехватчик событий -->
<div class="drag-interceptor"></div>

<div class="window-controls" onmousedown={handleDragStart} role="toolbar" tabindex="0">
  <!-- Кнопка плюс слева от кнопок управления -->
  <button
    class="new-tab-btn"
    onclick={(e) => {
      handleNewTab();
      removeFocus(e);
    }}
    title="Новая вкладка"
    aria-label="Новая вкладка"
  >
    <i class="ph ph-plus"></i>
  </button>

  <!-- Отступ между кнопкой плюс и кнопками управления -->
  <div class="control-spacer"></div>

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

<style>
  .window-controls {
    display: flex !important;
    align-items: center;
    height: var(--toolbar-height); /* Устанавливаем высоту тулбара в соответствии с переменной */
    position: fixed;
    top: 0px;
    right: 0px;
    z-index: 1001;
    gap: var(--spacing-xs);
    background: rgba(0, 0, 0, 0);
    padding: var(
      --container-padding
    ); /* Делаем одинаковые отступы справа, сверху и снизу (все по 6px) */
    border-radius: var(--btn-border-radius);
    backdrop-filter: blur(10px);
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    user-select: none;
  }

  .new-tab-btn {
    width: 24px;
    height: 24px;
    border: 1px solid var(--border-color); /* Добавляем обводку */
    background: rgba(255, 255, 255, 0.1); /* Возвращаем фоновую заливку */
    color: var(--text-secondary, #667085);
    cursor: default;
    display: flex !important;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    border-radius: 50%; /* Делаем круглой */
    transition: all 0.2s ease;
    -webkit-app-region: no-drag !important;
    opacity: 1;
    visibility: visible;
    pointer-events: auto !important;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    outline: none; /* Убираем outline */
    box-shadow: none; /* Убираем box-shadow */
  }

  .control-spacer {
    width: var(--btn-size-small);
    height: var(--btn-size-small);
    flex-shrink: 0;
    background: transparent;
  }

  .new-tab-btn:hover {
    background: var(--btn-bg-hover); /* Используем тот же ховер как у неактивных табов */
    color: var(--text-primary);
  }

  .control-btn {
    width: var(--btn-size-small);
    height: var(--btn-size-small);
    border: none; /* Убеждаемся, что обводки нет */
    background: none; /* Убираем фон */
    color: var(--text-secondary, #667085);
    cursor: default;
    display: flex !important;
    align-items: center;
    justify-content: center;
    font-size: var(--btn-icon-size);
    border-radius: var(--btn-border-radius); /* Возвращаем скругление для самой кнопки */
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
    border-radius: var(--btn-border-radius); /* Делаем ховер скругленным */
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

  /* Стили для иконок Phosphor */
  :global(.window-controls .ph) {
    font-family: 'Phosphor' !important;
    font-style: normal;
    font-weight: normal;
    line-height: 1;
    display: inline-block;
    vertical-align: middle;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Дополнительная видимость для иконок и защита от draggable */
  .window-controls i {
    opacity: 1 !important;
    visibility: visible !important;
    display: inline-block !important;
    -webkit-app-region: no-drag !important;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
  }
</style>
