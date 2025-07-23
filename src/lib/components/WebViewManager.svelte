<script lang="ts">
  import { getActiveTab, updateTabUrl, getWebviewInfo } from '../stores/browser.svelte.js';
  import { invoke } from '@tauri-apps/api/core';
  import type { Tab } from '../types/browser.js';
  import ErrorPage from './ErrorPage.svelte';

  let currentTab: Tab | undefined = $state();

  // Отслеживаем активную вкладку
  $effect(() => {
    currentTab = getActiveTab();

    // При изменении активной вкладки, убеждаемся что webview'ы правильно переключены
    if (currentTab) {
      if (currentTab.url === 'about:blank' || !currentTab.webviewLabel) {
        // Скрываем все webview'ы для about:blank вкладок
        invoke('hide_all_webviews').catch(console.error);
      }
    }
  });

  function showPlaceholder(): boolean {
    return !currentTab || currentTab.url === 'about:blank' || !currentTab.webviewLabel;
  }

  // Функция для быстрых ссылок
  async function openQuickLink(url: string, title: string) {
    if (currentTab) {
      await updateTabUrl(currentTab.id, url, title);
    }
  }

  // Функция для отладки (можно убрать в продакшене)
  async function debugWebviews() {
    const info = await getWebviewInfo();
    console.log('Webview info:', info);
  }
</script>

<div class="webview-manager">
  {#if showPlaceholder()}
    <div class="placeholder">
      <div class="placeholder-content">
        <h2>Добро пожаловать в Limni</h2>
        <p>Введите URL в адресную строку для начала работы</p>

        <div class="quick-links">
          <h3>Быстрые ссылки:</h3>
          <div class="links-grid">
            <button
              class="link-card"
              onclick={() => openQuickLink('https://www.google.com', 'Google')}
            >
              <i class="ph ph-google-logo link-icon google-color"></i>
              <div class="link-title">Google</div>
            </button>

            <button class="link-card" onclick={() => openQuickLink('https://github.com', 'GitHub')}>
              <i class="ph ph-github-logo link-icon github-color"></i>
              <div class="link-title">GitHub</div>
            </button>

            <button
              class="link-card"
              onclick={() => openQuickLink('https://stackoverflow.com', 'Stack Overflow')}
            >
              <i class="ph ph-stack-overflow-logo link-icon stackoverflow-color"></i>
              <div class="link-title">Stack Overflow</div>
            </button>

            <button
              class="link-card"
              onclick={() => openQuickLink('https://www.youtube.com', 'YouTube')}
            >
              <i class="ph ph-youtube-logo link-icon youtube-color"></i>
              <div class="link-title">YouTube</div>
            </button>
          </div>
        </div>

        <div class="features-info">
          <h3>Возможности интернет-навигатора:</h3>
          <div class="features-grid">
            <div class="feature-item">
              <i class="ph ph-lightning feature-icon"></i>
              <div class="feature-text">Встроенные WebView</div>
            </div>
            <div class="feature-item">
              <i class="ph ph-shield-check feature-icon"></i>
              <div class="feature-text">Безопасность</div>
            </div>
            <div class="feature-item">
              <i class="ph ph-rocket feature-icon"></i>
              <div class="feature-text">Высокая производительность</div>
            </div>
            <div class="feature-item">
              <i class="ph ph-device-mobile feature-icon"></i>
              <div class="feature-text">Современный интерфейс</div>
            </div>
          </div>
        </div>

        <!-- Кнопка отладки (можно убрать в продакшене) -->
        {#if import.meta.env.DEV}
          <div class="debug-section">
            <button class="debug-btn" onclick={debugWebviews}>
              <i class="ph ph-wrench"></i> Debug Webviews
            </button>
          </div>
        {/if}
      </div>
    </div>
  {:else}
    <!-- Встроенные webview'ы управляются через Tauri API -->
    <div class="webview-area">
      {#if currentTab?.isLoading && !currentTab?.hasError}
        <div class="loading-overlay">
          <div class="loading-spinner"></div>
          <p>Загрузка страницы...</p>
        </div>
      {/if}

      <!-- Страница ошибки -->
      {#if currentTab?.hasError}
        <ErrorPage tab={currentTab} />
      {/if}
    </div>
  {/if}
</div>

<style>
  .webview-manager {
    flex: 1;
    position: relative;
    background: var(--bg-primary);
    overflow: hidden;
    z-index: 1; /* Низкий z-index чтобы быть под UI элементами */
  }

  .webview-area {
    width: 100%;
    height: 100%;
    position: relative;
    z-index: 1; /* Низкий z-index для webview области */
  }

  .placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: var(--spacing-32px);
  }

  .placeholder-content {
    text-align: center;
    max-width: 800px; /* Пока оставляем как есть */
    width: 100%;
  }

  .placeholder-content h2 {
    color: var(--text-primary);
    margin-bottom: var(--spacing-16px);
    font-size: var(--font-size-40px); /* 2.5rem */
    font-weight: 300;
    background: linear-gradient(135deg, var(--accent-color), var(--accent-color-dark));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .placeholder-content p {
    color: var(--text-secondary);
    margin-bottom: var(--spacing-48px); /* 3rem */
    font-size: var(--font-size-20px);
  }

  .quick-links h3 {
    color: var(--text-primary);
    margin-bottom: var(--spacing-24px); /* 1.5rem */
    font-size: var(--font-size-20px);
    font-weight: 500;
  }

  .links-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(176px, 1fr));
    gap: var(--spacing-24px);
    margin-bottom: var(--spacing-48px); /* 3rem */
  }

  .link-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--spacing-32px) var(--spacing-24px); /* 2rem 1.5rem */
    background: var(--bg-secondary);
    border: var(--card-border-width-1px) solid var(--border-color);
    border-radius: var(--spacing-16px); /* var(--spacing-lg) */
    transition: all 0.3s ease;
    cursor: default;
    text-decoration: none;
    position: relative;
    overflow: hidden;
  }

  .link-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transition: left 0.5s ease;
  }

  .link-card:hover::before {
    left: 100%;
  }

  .link-card:hover {
    background: var(--btn-bg-hover);
    transform: translateY(-8px); /* Было -4px, изменено на -8px для 8px сетки */
    box-shadow: var(--shadow-md);
    border-color: var(--accent-color);
  }

  .link-icon {
    font-size: var(--icon-size-40px); /* 2.5rem */
    margin-bottom: var(--spacing-16px); /* 1rem */
    filter: drop-shadow(0 var(--spacing-2px) var(--spacing-4px) rgba(0, 0, 0, 0.1));
    transition:
      color 0.3s ease,
      transform 0.3s ease;
  }

  /* Брендовые цвета для иконок */
  .link-icon.google-color {
    color: #4285f4; /* Google Blue */
  }

  .link-icon.github-color {
    color: #181717; /* GitHub Black */
  }

  .link-icon.stackoverflow-color {
    color: #f48024; /* Stack Overflow Orange */
  }

  .link-icon.youtube-color {
    color: #ff0000; /* YouTube Red */
  }

  /* Эффекты при наведении на карточку */
  .link-card:hover .link-icon {
    transform: scale(1.1);
  }

  .link-card:hover .link-icon.google-color {
    color: #3367d6; /* Более насыщенный Google Blue */
  }

  .link-card:hover .link-icon.github-color {
    color: #24292e; /* Более светлый GitHub */
  }

  .link-card:hover .link-icon.stackoverflow-color {
    color: #da680b; /* Более насыщенный Stack Overflow Orange */
  }

  .link-card:hover .link-icon.youtube-color {
    color: #cc0000; /* Более темный YouTube Red */
  }

  .link-title {
    color: var(--text-primary);
    font-size: var(--font-size-16px); /* 1rem */
    font-weight: 600;
  }

  .features-info h3 {
    color: var(--text-primary);
    margin-bottom: var(--spacing-24px); /* 1.5rem */
    font-size: var(--font-size-20px);
    font-weight: 500;
  }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(
      auto-fit,
      minmax(192px, 1fr)
    ); /* Было 200px, изменено на 192px для 8px сетки */
    gap: var(--spacing-16px);
    margin-bottom: var(--spacing-32px); /* 2rem */
  }

  .feature-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-16px);
    padding: var(--spacing-16px);
    background: var(--bg-secondary);
    border: var(--card-border-width-1px) solid var(--border-color);
    border-radius: var(--card-border-radius-8px);
    transition: all 0.2s ease;
  }

  .feature-item:hover {
    background: var(--btn-bg-hover);
    transform: translateX(var(--spacing-8px)); /* Было 4px, изменено на 8px для 8px сетки */
  }

  .feature-icon {
    font-size: var(--font-size-24px); /* 1.5rem */
  }

  .feature-text {
    color: var(--text-primary);
    font-weight: 500;
  }

  .debug-section {
    margin-top: var(--spacing-32px); /* 2rem */
  }

  .debug-btn {
    background: var(--bg-secondary);
    border: var(--card-border-width-1px) solid var(--border-color);
    color: var(--text-primary);
    padding: var(--spacing-8px) var(--spacing-16px);
    border-radius: var(--button-border-radius-8px);
    cursor: default;
    font-size: var(--font-size-14px);
    transition: all 0.2s ease;
  }

  .debug-btn:hover {
    background: var(--btn-bg-hover);
    border-color: var(--accent-color);
  }

  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.95);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 10;
  }

  :global(:root[data-theme='dark']) .loading-overlay {
    background: rgba(30, 30, 30, 0.95);
  }

  .loading-spinner {
    width: var(--spacing-48px);
    height: var(--spacing-48px);
    border: var(--spacing-8px) solid var(--border-color); /* Было 4px, изменено на 8px для 8px сетки */
    border-top: var(--spacing-8px) solid var(--accent-color); /* Было 4px, изменено на 8px для 8px сетки */
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: var(--spacing-24px); /* 1.5rem */
  }

  .loading-overlay p {
    color: var(--text-primary);
    font-size: var(--font-size-16px);
    font-weight: 500;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  /* Убираем стили кнопки для link-card */
  .link-card {
    background: none;
    border: none;
    font-family: inherit;
  }
</style>
