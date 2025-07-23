<script lang="ts">
  import { browserState } from '../stores/browser.svelte.js';

  // Заглушки для расширений
  const extensions = [
    { id: '1', name: 'uBlock Origin', enabled: true, icon: '🛡️' },
    { id: '2', name: 'Dark Reader', enabled: true, icon: '🌙' },
    { id: '3', name: 'LastPass', enabled: false, icon: '🔐' },
  ];

  function toggleExtension(id: string) {
    // TODO: Implement extension toggle
    console.log('Toggle extension:', id);
  }
</script>

{#if browserState.showExtensions}
  <div class="extensions-panel">
    <div class="panel-header">
      <h3>Расширения</h3>
      <button
        class="close-btn"
        onclick={() => (browserState.showExtensions = false)}
        aria-label="Закрыть"
        title="Закрыть"
      >
        <i class="ph ph-x"></i>
      </button>
    </div>

    <div class="extensions-list">
      {#each extensions as extension}
        <div class="extension-item">
          <div class="extension-info">
            <span class="extension-icon">{extension.icon}</span>
            <span class="extension-name">{extension.name}</span>
          </div>
          <button
            class="toggle-btn"
            class:enabled={extension.enabled}
            onclick={() => toggleExtension(extension.id)}
          >
            {extension.enabled ? 'Выкл' : 'Вкл'}
          </button>
        </div>
      {/each}
    </div>

    <div class="panel-footer">
      <button class="add-extension-btn">
        <i class="ph ph-plus"></i>
        Добавить расширение
      </button>
    </div>
  </div>
{/if}

<style>
  .extensions-panel {
    position: absolute;
    top: 100%;
    right: var(--spacing-152px); /* Было 150px, изменено на 152px для 8px сетки */
    width: 300px; /* Пока оставляем как есть, потребуется более детальный расчет */
    background: var(--bg-primary);
    border: var(--card-border-width-1px) solid var(--border-color);
    border-radius: var(--card-border-radius-8px); /* Было 12px, изменено на 8px для 8px сетки */
    box-shadow: var(--shadow-lg);
    z-index: 1000;
    max-height: 400px; /* Пока оставляем как есть */
    overflow-y: auto;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-16px);
    border-bottom: var(--card-border-width-1px) solid var(--border-color);
  }

  .panel-header h3 {
    margin: 0;
    font-size: var(--font-size-16px);
    font-weight: 600;
    color: var(--text-primary);
  }

  .close-btn {
    width: var(--button-height-medium);
    height: var(--button-height-medium);
    border: none;
    background: transparent;
    color: var(--text-secondary);
    border-radius: var(--button-border-radius-8px);
    cursor: default;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--icon-size-16px);
  }

  .close-btn:hover {
    background: var(--btn-bg-hover);
    color: var(--text-primary);
  }

  .extensions-list {
    padding: var(--spacing-8px);
  }

  .extension-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-16px); /* Было 12px, изменено на 16px для 8px сетки */
    border-radius: var(--card-border-radius-8px);
    transition: background-color 0.2s ease;
  }

  .extension-item:hover {
    background: var(--btn-bg-hover);
  }

  .extension-info {
    display: flex;
    align-items: center;
    gap: var(--spacing-16px); /* Соответствует 4px сетке */
  }

  .extension-icon {
    font-size: var(--icon-size-24px); /* Было 20px, изменено на 24px для 8px сетки */
  }

  .extension-name {
    font-size: var(--font-size-14px);
    color: var(--text-primary);
    font-weight: 500;
  }

  .toggle-btn {
    padding: var(--spacing-8px) var(--spacing-16px); /* Было 4px 12px, изменено на 8px 16px для 8px сетки */
    border: var(--card-border-width-1px) solid var(--border-color);
    background: var(--bg-secondary);
    color: var(--text-secondary);
    border-radius: var(--button-border-radius-8px); /* Было 6px, изменено на 8px для 8px сетки */
    cursor: default;
    font-size: var(--font-size-12px);
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .toggle-btn.enabled {
    background: var(--accent-color);
    color: white;
    border-color: var(--accent-color);
  }

  .toggle-btn:hover {
    border-color: var(--accent-color);
  }

  .panel-footer {
    padding: var(--spacing-16px);
    border-top: var(--card-border-width-1px) solid var(--border-color);
  }

  .add-extension-btn {
    width: 100%;
    padding: var(--spacing-16px);
    border: var(--card-border-width-1px) dashed var(--border-color);
    background: transparent;
    color: var(--text-secondary);
    border-radius: var(--card-border-radius-8px);
    cursor: default;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-8px);
    font-size: var(--font-size-14px);
    transition: all 0.2s ease;
  }

  .add-extension-btn:hover {
    border-color: var(--accent-color);
    color: var(--accent-color);
  }
</style>
