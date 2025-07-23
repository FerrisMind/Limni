<script lang="ts">
  import type { Tab } from '../types/browser.js';
  import { reloadTab } from '../stores/browser.svelte.js';

  interface Props {
    tab: Tab;
  }

  const { tab }: Props = $props();

  async function handleReload() {
    await reloadTab(tab.id);
  }

  function getErrorTitle(errorMessage?: string): string {
    if (!errorMessage) return 'Ошибка загрузки страницы';

    if (errorMessage.includes('net::ERR_INTERNET_DISCONNECTED')) {
      return 'Нет подключения к интернету';
    }
    if (errorMessage.includes('net::ERR_NAME_NOT_RESOLVED')) {
      return 'Сайт не найден';
    }
    if (errorMessage.includes('net::ERR_CONNECTION_TIMED_OUT')) {
      return 'Время ожидания истекло';
    }
    if (errorMessage.includes('net::ERR_CONNECTION_REFUSED')) {
      return 'Соединение отклонено';
    }

    return 'Ошибка загрузки страницы';
  }

  function getErrorDescription(errorMessage?: string): string {
    if (!errorMessage) return 'Произошла неизвестная ошибка при загрузке страницы.';

    if (errorMessage.includes('net::ERR_INTERNET_DISCONNECTED')) {
      return 'Проверьте подключение к интернету и попробуйте снова.';
    }
    if (errorMessage.includes('net::ERR_NAME_NOT_RESOLVED')) {
      return 'Не удалось найти сайт. Проверьте правильность адреса.';
    }
    if (errorMessage.includes('net::ERR_CONNECTION_TIMED_OUT')) {
      return 'Сервер слишком долго не отвечает. Попробуйте перезагрузить страницу.';
    }
    if (errorMessage.includes('net::ERR_CONNECTION_REFUSED')) {
      return 'Сервер отклонил соединение. Возможно, сайт временно недоступен.';
    }

    return 'Произошла ошибка при загрузке страницы. Попробуйте перезагрузить.';
  }
</script>

<div class="error-page">
  <div class="error-content">
    <div class="error-icon">
      <svg
        width="64"
        height="64"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12" cy="12" r="10" stroke="#ef4444" stroke-width="2" />
        <line x1="15" y1="9" x2="9" y2="15" stroke="#ef4444" stroke-width="2" />
        <line x1="9" y1="9" x2="15" y2="15" stroke="#ef4444" stroke-width="2" />
      </svg>
    </div>

    <h1 class="error-title">{getErrorTitle(tab.errorMessage)}</h1>

    <p class="error-description">
      {getErrorDescription(tab.errorMessage)}
    </p>

    <div class="error-url">
      <strong>URL:</strong>
      {tab.url}
    </div>

    {#if tab.errorMessage}
      <details class="error-details">
        <summary>Техническая информация</summary>
        <code class="error-code">{tab.errorMessage}</code>
      </details>
    {/if}

    <div class="error-actions">
      <button class="reload-button" onclick={handleReload}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1 4v6h6"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        Перезагрузить страницу
      </button>
    </div>
  </div>
</div>

<style>
  .error-page {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100%;
    padding: var(--spacing-32px);
    background: linear-gradient(
      135deg,
      var(--bg-primary) 0%,
      var(--bg-secondary) 100%
    ); /* Использование переменных для градиента */
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .error-content {
    text-align: center;
    max-width: 500px;
    background: var(--bg-secondary);
    padding: var(--spacing-40px) var(--spacing-32px); /* Было 3rem 2rem, изменено на 40px 32px для 8px сетки */
    border-radius: var(--card-border-radius-16px); /* 16px */
    box-shadow: var(--shadow-md);
    border: var(--card-border-width-1px) solid var(--border-color);
  }

  .error-icon {
    margin-bottom: var(--spacing-24px); /* Было 1.5rem, изменено на 24px для 8px сетки */
    display: flex;
    justify-content: center;
  }

  .error-title {
    font-size: var(--font-size-24px); /* 1.5rem */
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 var(--spacing-16px) 0; /* Было 1rem, изменено на 16px для 8px сетки */
    line-height: var(--line-height-24px); /* 1.3 */
  }

  .error-description {
    font-size: var(--font-size-16px); /* 1rem */
    color: var(--text-secondary);
    margin: 0 0 var(--spacing-24px) 0; /* Было 1.5rem, изменено на 24px для 8px сетки */
    line-height: var(--line-height-24px); /* 1.5 */
  }

  .error-url {
    background: var(--bg-tertiary);
    padding: var(--spacing-8px) var(--spacing-16px); /* Было 0.75rem 1rem, изменено на 8px 16px для 8px сетки */
    border-radius: var(--card-border-radius-8px);
    font-size: var(--font-size-14px); /* 0.875rem */
    color: var(--text-secondary);
    margin-bottom: var(--spacing-24px); /* Было 1.5rem, изменено на 24px для 8px сетки */
    word-break: break-all;
    border: var(--card-border-width-1px) solid var(--border-color);
  }

  .error-details {
    text-align: left;
    margin-bottom: var(--spacing-32px); /* 2rem */
  }

  .error-details summary {
    cursor: default;
    font-size: var(--font-size-14px); /* 0.875rem */
    color: var(--text-secondary);
    margin-bottom: var(--spacing-8px); /* Было 0.5rem, изменено на 8px для 8px сетки */
    user-select: none;
  }

  .error-details summary:hover {
    color: var(--text-primary);
  }

  .error-code {
    display: block;
    background: var(--bg-tertiary);
    color: var(--text-primary);
    padding: var(--spacing-16px); /* Было 1rem, изменено на 16px для 8px сетки */
    border-radius: var(--card-border-radius-8px); /* Было 6px, изменено на 8px для 8px сетки */
    font-size: var(--font-size-12px); /* 0.75rem */
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    white-space: pre-wrap;
    word-break: break-all;
    margin-top: var(--spacing-8px); /* Было 0.5rem, изменено на 8px для 8px сетки */
  }

  .error-actions {
    display: flex;
    justify-content: center;
    gap: var(--spacing-16px); /* Было 1rem, изменено на 16px для 8px сетки */
  }

  .reload-button {
    display: flex;
    align-items: center;
    gap: var(--spacing-8px); /* Было 0.5rem, изменено на 8px для 8px сетки */
    background: var(--accent-color);
    color: white;
    border: none;
    padding: var(--spacing-8px) var(--spacing-24px); /* Было 0.75rem 1.5rem, изменено на 8px 24px для 8px сетки */
    border-radius: var(--button-border-radius-8px);
    font-size: var(--font-size-14px); /* 0.875rem */
    font-weight: 500;
    cursor: default;
    transition: all 0.2s ease;
  }

  .reload-button:hover {
    background: var(--accent-color);
    transform: translateY(-8px); /* Было -1px, изменено на -8px для 8px сетки */
    box-shadow: var(--shadow-md); /* Обновлено */
  }

  .reload-button:active {
    transform: translateY(0);
  }
</style>
