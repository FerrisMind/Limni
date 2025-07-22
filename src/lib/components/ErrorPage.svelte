<script lang="ts">
  import type { Tab } from '../types/browser.js';
  import { reloadTab } from '../stores/browser.svelte.js';

  interface Props {
    tab: Tab;
  }

  const { tab } = $props<Props>();

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
    padding: 2rem;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .error-content {
    text-align: center;
    max-width: 500px;
    background: white;
    padding: 3rem 2rem;
    border-radius: 16px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    border: 1px solid #e2e8f0;
  }

  .error-icon {
    margin-bottom: 1.5rem;
    display: flex;
    justify-content: center;
  }

  .error-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 1rem 0;
    line-height: 1.3;
  }

  .error-description {
    font-size: 1rem;
    color: #64748b;
    margin: 0 0 1.5rem 0;
    line-height: 1.5;
  }

  .error-url {
    background: #f1f5f9;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    font-size: 0.875rem;
    color: #475569;
    margin-bottom: 1.5rem;
    word-break: break-all;
    border: 1px solid #e2e8f0;
  }

  .error-details {
    text-align: left;
    margin-bottom: 2rem;
  }

  .error-details summary {
    cursor: pointer;
    font-size: 0.875rem;
    color: #64748b;
    margin-bottom: 0.5rem;
    user-select: none;
  }

  .error-details summary:hover {
    color: #475569;
  }

  .error-code {
    display: block;
    background: #1e293b;
    color: #e2e8f0;
    padding: 1rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    white-space: pre-wrap;
    word-break: break-all;
    margin-top: 0.5rem;
  }

  .error-actions {
    display: flex;
    justify-content: center;
    gap: 1rem;
  }

  .reload-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: #3b82f6;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .reload-button:hover {
    background: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  .reload-button:active {
    transform: translateY(0);
  }
</style>
