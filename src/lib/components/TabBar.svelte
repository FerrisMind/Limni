<script lang="ts">
  import { browserState, setActiveTab, closeTab } from '../stores/browser.svelte.js';

  async function handleTabClick(tabId: string) {
    await setActiveTab(tabId);
  }

  async function handleTabClose(event: Event, tabId: string) {
    event.stopPropagation();
    await closeTab(tabId);
  }

  function getTabTitle(title: string): string {
    console.log('🎯 TabBar rendering title:', title);
    if (title.length > 16) { /* Уменьшаем с 20 до 16 символов */
      return title.substring(0, 16) + '...';
    }
    return title;
  }
</script>

<div class="tab-bar" data-tauri-drag-region>
  <!-- Прокручиваемый контейнер только для табов -->
  <div class="tabs-scrollable" data-tauri-drag-region>
    {#each browserState.tabs as tab (tab.id)}
      <div class="tab" class:active={tab.isActive}>
        <button 
          class="tab-main"
          onclick={() => handleTabClick(tab.id)}
          type="button"
          aria-label="Переключиться на вкладку: {tab.title}"
        >
          <div class="tab-content">
            {#if tab.isLoading}
              <i class="ph ph-circle-notch tab-icon loading"></i>
            {:else if tab.favicon}
              <img src={tab.favicon} alt="Favicon" class="tab-favicon" onerror={event => { (event.currentTarget as HTMLImageElement).onerror = null; (event.currentTarget as HTMLImageElement).src = ''; }} />
            {:else if tab.webviewLabel}
              <i class="ph ph-globe tab-icon"></i>
            {:else}
              <i class="ph ph-file-text tab-icon"></i>
            {/if}
            
            <span class="tab-title">{getTabTitle(tab.title)}</span>
          </div>
        </button>
        
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
</div>

<style>
  .tab-bar {
    display: flex;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
    overflow: hidden;
    min-height: var(--tabbar-height);
    position: relative;
    z-index: 1000;
    padding: var(--container-padding) 220px var(--container-padding) var(--container-padding);
  }

  .tabs-scrollable {
    display: flex;
    flex: 1;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
    /* Контейнер вкладок draggable - пустые области между вкладками можно перетаскивать */
    -webkit-app-region: drag;
  }

  .empty-space {
    flex: 1;
    min-height: var(--btn-size-small);
    -webkit-app-region: drag;
  }

  .tabs-scrollable::-webkit-scrollbar {
    display: none;
  }

  .tab {
    display: flex;
    align-items: center;
    min-width: 160px;
    max-width: 240px;
    height: var(--btn-size-small);
    background: var(--bg-secondary);
    border-right: 1px solid var(--border-color);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    border-radius: var(--btn-border-radius);
    margin-right: var(--spacing-xs);
    flex-shrink: 0;
    -webkit-app-region: no-drag;
  }

  .tab:hover:not(.active) {
    background: var(--btn-bg-hover);
  }

  .tab.active {
    background: #2f6bff;
    color: white;
    border-bottom: none;
    box-shadow: 0 2px 8px rgba(47, 107, 255, 0.3);
    z-index: 2;
  }

  .tab.active .tab-title {
    color: white;
    font-weight: 500;
  }

  .tab.active .tab-icon {
    color: white;
  }

  .tab.active .tab-close {
    color: rgba(255, 255, 255, 0.8);
  }

  .tab.active .tab-close:hover {
    background: rgba(255, 255, 255, 0.2);
    color: white;
  }

  .tab-main {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    flex: 1;
    height: var(--btn-size-small);
    display: flex;
    align-items: center;
    border-radius: var(--btn-border-radius);
    -webkit-app-region: no-drag;
  }

  .tab-content {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: 0 var(--spacing-md);
    width: 100%;
    min-width: 0;
    -webkit-app-region: no-drag;
  }

  .tab-icon {
    flex-shrink: 0;
    font-size: var(--btn-font-size);
    width: var(--btn-icon-size);
    height: var(--btn-icon-size);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
  }

  .tab-favicon {
    flex-shrink: 0;
    width: var(--btn-icon-size);
    height: var(--btn-icon-size);
    object-fit: contain;
    margin-right: var(--spacing-sm); /* Отступ как у tab-icon */
  }

  .tab-icon.loading {
    animation: spin 1s linear infinite;
    color: var(--accent-color);
  }

  .tab.active .tab-icon.loading {
    color: white;
  }

  .tab-title {
    flex: 1;
    color: var(--text-primary);
    font-size: 13px;
    font-weight: 400;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
    line-height: 1.4;
  }

  .tab-close {
    flex-shrink: 0;
    background: none;
    border: none;
    color: var(--text-secondary);
    font-size: var(--btn-font-size);
    cursor: pointer;
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    transition: all 0.2s ease;
    opacity: 0.7;
    margin-right: var(--spacing-xs);
    -webkit-app-region: no-drag;
  }

  .tab-close:hover {
    background: var(--btn-bg-hover);
    color: var(--text-primary);
    opacity: 1;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style> 