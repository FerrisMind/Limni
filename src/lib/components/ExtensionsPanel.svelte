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
    right: 150px;
    width: 300px;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    z-index: 1000;
    max-height: 400px;
    overflow-y: auto;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid var(--border-color);
  }

  .panel-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .close-btn {
    width: var(--btn-size-small);
    height: var(--btn-size-small);
    border: none;
    background: transparent;
    color: var(--text-secondary);
    border-radius: var(--btn-border-radius);
    cursor: default;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--btn-icon-size);
  }

  .close-btn:hover {
    background: var(--btn-bg-hover);
    color: var(--text-primary);
  }

  .extensions-list {
    padding: 8px;
  }

  .extension-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    border-radius: 8px;
    transition: background-color 0.2s ease;
  }

  .extension-item:hover {
    background: var(--btn-bg-hover);
  }

  .extension-info {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  .extension-icon {
    font-size: 20px;
  }

  .extension-name {
    font-size: 14px;
    color: var(--text-primary);
    font-weight: 500;
  }

  .toggle-btn {
    padding: 4px 12px;
    border: 1px solid var(--border-color);
    background: var(--bg-secondary);
    color: var(--text-secondary);
    border-radius: 6px;
    cursor: default;
    font-size: 12px;
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
    padding: 16px;
    border-top: 1px solid var(--border-color);
  }

  .add-extension-btn {
    width: 100%;
    padding: 12px;
    border: 1px dashed var(--border-color);
    background: transparent;
    color: var(--text-secondary);
    border-radius: 8px;
    cursor: default;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    font-size: 14px;
    transition: all 0.2s ease;
  }

  .add-extension-btn:hover {
    border-color: var(--accent-color);
    color: var(--accent-color);
  }
</style>
