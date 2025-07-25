<script lang="ts">
  import { settings, browserState } from '../stores/browser.svelte.js';

  function closePanel() {
    browserState.showSettings = false;
  }

  function toggleTheme() {
    if (settings.theme === 'light') {
      settings.theme = 'dark';
      document.documentElement.setAttribute('data-theme', 'dark');
    } else if (settings.theme === 'dark') {
      settings.theme = 'system';
      // Определяем системную тему
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      settings.theme = 'light';
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }

  function getThemeLabel(): string {
    switch (settings.theme) {
      case 'light':
        return 'Светлая';
      case 'dark':
        return 'Тёмная';
      case 'system':
        return 'Системная';
      default:
        return 'Системная';
    }
  }

  function resetSettings() {
    if (confirm('Сбросить все настройки к значениям по умолчанию?')) {
      settings.homepage = 'https://www.google.com';
      settings.searchEngine = 'google';
      settings.theme = 'system';
      settings.allowJavaScript = true;
      settings.allowImages = true;
      settings.allowCookies = true;

      // Применяем тему
      toggleTheme();
    }
  }

  // Инициализация темы при загрузке
  $effect(() => {
    if (settings.theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', settings.theme);
    }
  });
</script>

{#if browserState.showSettings}
  <div class="settings-panel">
    <div class="panel-header">
      <h3>Настройки</h3>
      <button
        class="action-btn close-btn"
        onclick={closePanel}
        title="Закрыть"
        aria-label="Закрыть панель настроек"
      >
        <i class="ph ph-x"></i>
      </button>
    </div>

    <div class="settings-content">
      <div class="settings-section">
        <h4>Общие</h4>

        <div class="setting-item">
          <label class="setting-label">
            Домашняя страница
            <input
              type="url"
              bind:value={settings.homepage}
              class="setting-input"
              placeholder="https://example.com"
            />
          </label>
        </div>

        <div class="setting-item">
          <label class="setting-label">
            Поисковая система
            <select bind:value={settings.searchEngine} class="setting-select">
              <option value="google">Google</option>
              <option value="bing">Bing</option>
              <option value="duckduckgo">DuckDuckGo</option>
              <option value="yandex">Яндекс</option>
            </select>
          </label>
        </div>

        <div class="setting-item">
          <label class="setting-label">
            Тема
            <div class="theme-selector">
              <span class="theme-current">{getThemeLabel()}</span>
              <button class="theme-btn" onclick={toggleTheme}> Изменить </button>
            </div>
          </label>
        </div>
      </div>

      <div class="settings-section">
        <h4>Безопасность и конфиденциальность</h4>

        <div class="setting-item">
          <label class="setting-checkbox">
            <input type="checkbox" bind:checked={settings.allowJavaScript} />
            <span class="checkbox-label">Разрешить JavaScript</span>
          </label>
          <p class="setting-description">Включает выполнение JavaScript на веб-страницах</p>
        </div>

        <div class="setting-item">
          <label class="setting-checkbox">
            <input type="checkbox" bind:checked={settings.allowImages} />
            <span class="checkbox-label">Загружать изображения</span>
          </label>
          <p class="setting-description">Автоматически загружать и отображать изображения</p>
        </div>

        <div class="setting-item">
          <label class="setting-checkbox">
            <input type="checkbox" bind:checked={settings.allowCookies} />
            <span class="checkbox-label">Разрешить cookies</span>
          </label>
          <p class="setting-description">Позволяет сайтам сохранять файлы cookie в приложении</p>
        </div>
      </div>

      <div class="settings-section">
        <h4>О приложении</h4>

        <div class="about-info">
          <div class="browser-info">
            <h5>Limni</h5>
            <p>Версия 0.1.0</p>
            <p>Создан на Tauri v2 + Svelte 5</p>
          </div>

          <div class="feature-list">
            <h6>Возможности:</h6>
            <ul>
              <li><i class="ph ph-check"></i> Многовкладочная навигация</li>
              <li><i class="ph ph-check"></i> Система закладок</li>
              <li><i class="ph ph-check"></i> История посещений</li>
              <li><i class="ph ph-check"></i> Поиск в интернете</li>
              <li><i class="ph ph-check"></i> Настройки безопасности</li>
              <li><i class="ph ph-check"></i> Тёмная и светлая темы</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="settings-actions">
        <button class="reset-btn" onclick={resetSettings}> Сбросить настройки </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .settings-panel {
    position: fixed;
    top: calc(
      var(--tabbar-height) + var(--toolbar-height)
    ); /* Правильная высота: 44px + 45px = 89px */
    left: 50%;
    transform: translateX(-50%);
    width: 600px;
    max-width: 90vw;
    height: calc(100vh - var(--tabbar-height) - var(--toolbar-height));
    background: var(--bg-primary);
    border: var(--card-border-width-1px) solid var(--border-color);
    border-radius: var(--modal-border-radius-8px) var(--modal-border-radius-8px) 0 0; /* Было 12px, изменено на 8px для 8px сетки */
    display: flex;
    flex-direction: column;
    z-index: 1001; /* Увеличиваем z-index чтобы быть поверх webview'ов */
    box-shadow: var(--shadow-md);
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--modal-padding-24px) var(--modal-padding-24px);
    border-bottom: var(--card-border-width-1px) solid var(--border-color);
    background: var(--bg-secondary);
    border-radius: var(--modal-border-radius-8px) var(--modal-border-radius-8px) 0 0;
  }

  .panel-header h3 {
    margin: 0;
    color: var(--text-primary);
    font-size: var(--font-size-20px); /* Изменено на 20px */
    font-weight: 600;
  }

  .action-btn {
    width: var(--button-height-medium);
    height: var(--button-height-medium);
    border: none;
    border-radius: var(--button-border-radius-8px);
    background: var(--btn-bg);
    color: var(--text-primary);
    font-size: var(--icon-size-16px);
    cursor: default;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s ease;
  }

  .action-btn:hover {
    background: var(--btn-bg-hover);
  }

  .settings-content {
    flex: 1;
    overflow-y: auto;
    padding: var(--modal-padding-24px);
  }

  .settings-section {
    margin-bottom: var(--spacing-32px);
  }

  .settings-section h4 {
    margin: 0 0 var(--spacing-16px) 0;
    color: var(--text-primary);
    font-size: var(--font-size-16px);
    font-weight: 600;
    border-bottom: var(--input-focus-outline-2px) solid var(--accent-color);
    padding-bottom: var(--spacing-8px);
  }

  .setting-item {
    margin-bottom: var(--spacing-24px);
  }

  .setting-label {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-8px);
    color: var(--text-primary);
    font-weight: 500;
  }

  .setting-input,
  .setting-select {
    height: var(--input-height-32px);
    padding: 0 var(--input-padding-12px);
    border: var(--input-border-width-1px) solid var(--border-color);
    border-radius: var(--input-border-radius-4px);
    background: var(--bg-secondary);
    color: var(--text-primary);
    font-size: var(--font-size-14px);
    outline: none;
    transition: border-color 0.2s ease;
  }

  .setting-input:focus,
  .setting-select:focus {
    border-color: var(--accent-color);
    box-shadow: 0 0 0 var(--input-focus-outline-2px) var(--accent-color-light);
  }

  .theme-selector {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-16px) var(--spacing-20px);
    background: var(--bg-secondary);
    border: var(--input-border-width-1px) solid var(--border-color);
    border-radius: var(--input-border-radius-4px);
  }

  .theme-current {
    color: var(--text-primary);
    font-weight: 500;
  }

  .theme-btn {
    padding: var(--button-padding-horizontal-small) var(--button-padding-horizontal-medium);
    border: none;
    border-radius: var(--button-border-radius-6px);
    background: var(--accent-color);
    color: white;
    font-size: var(--font-size-12px);
    cursor: default;
    transition: background-color 0.2s ease;
  }

  .theme-btn:hover {
    background: var(--accent-color);
    opacity: 0.9;
  }

  .setting-checkbox {
    display: flex;
    align-items: center;
    gap: var(--checkbox-text-spacing-8px);
    cursor: default;
  }

  .setting-checkbox input[type='checkbox'] {
    width: var(--checkbox-size-16px);
    height: var(--checkbox-size-16px);
    cursor: default;
  }

  .checkbox-label {
    color: var(--text-primary);
    font-weight: 500;
  }

  .setting-description {
    margin: var(--spacing-8px) 0 0 var(--spacing-32px);
    color: var(--text-secondary);
    font-size: var(--font-size-12px);
    line-height: var(--line-height-14px); /* Changed to 1.4, which is 20px / 14px */
  }

  .about-info {
    display: flex;
    gap: var(--spacing-24px);
  }

  .browser-info h5 {
    margin: 0 0 var(--spacing-8px) 0;
    color: var(--text-primary);
    font-size: var(--font-size-16px);
    font-weight: 600;
  }

  .browser-info p {
    margin: var(--spacing-8px) 0; /* Было 4px, изменено на 8px для 8px сетки */
    color: var(--text-secondary);
    font-size: var(--font-size-14px);
  }

  .feature-list h6 {
    margin: 0 0 var(--spacing-16px) 0; /* Было 12px, изменено на 16px для 8px сетки */
    color: var(--text-primary);
    font-size: var(--font-size-16px);
    font-weight: 600;
  }

  .feature-list ul {
    margin: 0;
    padding-left: var(--spacing-24px);
    color: var(--text-secondary);
    font-size: var(--font-size-14px);
  }

  .feature-list li {
    margin-bottom: var(--spacing-8px);
  }

  .settings-actions {
    display: flex;
    justify-content: center;
    padding-top: var(--spacing-24px);
    border-top: var(--card-border-width-1px) solid var(--border-color);
    margin-top: var(--spacing-24px);
  }

  .reset-btn {
    padding: var(--button-padding-horizontal-large) var(--spacing-24px); /* Было 12px 24px, изменено на 16px 24px для 8px сетки */
    border: var(--card-border-width-1px) solid var(--border-color);
    border-radius: var(--card-border-radius-8px);
    background: var(--bg-secondary);
    color: var(--text-secondary);
    font-size: var(--font-size-14px);
    cursor: default;
    transition: all 0.2s ease;
  }

  .reset-btn:hover {
    background: var(--btn-bg-hover);
    color: var(--text-primary);
  }

  /* Scrollbar */
  .settings-content::-webkit-scrollbar {
    width: var(--spacing-8px);
  }

  .settings-content::-webkit-scrollbar-track {
    background: transparent;
  }

  .settings-content::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: var(--card-border-radius-8px); /* Было 4px, изменено на 8px для 8px сетки */
  }

  .settings-content::-webkit-scrollbar-thumb:hover {
    background: var(--text-secondary);
  }

  @media (max-width: 768px) {
    .about-info {
      flex-direction: column;
      gap: var(--spacing-16px);
    }
  }
</style>
