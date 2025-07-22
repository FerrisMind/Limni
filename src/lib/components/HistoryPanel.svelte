<script lang="ts">
  import { history, clearHistory, getActiveTab, updateTabUrl } from '../stores/browser.svelte.js';
  import { browserState } from '../stores/browser.svelte.js';
  import type { HistoryEntry } from '../types/browser.js';

  function openHistoryEntry(url: string, title: string) {
    const activeTab = getActiveTab();
    if (activeTab) {
      updateTabUrl(activeTab.id, url, title);
    }
  }

  function clearAllHistory() {
    if (confirm('Очистить всю историю? Это действие нельзя отменить.')) {
      clearHistory();
    }
  }

  function formatDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Сегодня';
    } else if (diffDays === 1) {
      return 'Вчера';
    } else if (diffDays < 7) {
      return `${diffDays} дней назад`;
    } else {
      return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(date);
    }
  }

  function formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  function closePanel() {
    browserState.showHistory = false;
  }

  let searchQuery = $state('');

  const filteredHistory = $derived(
    history.filter(
      (entry) =>
        entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.url.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const groupedHistory = $derived(() => {
    const grouped = new Map<string, HistoryEntry[]>();

    for (const entry of filteredHistory) {
      const dateKey = formatDate(entry.visitedAt);
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(entry);
    }

    return grouped;
  });
</script>

{#if browserState.showHistory}
  <div class="history-panel">
    <div class="panel-header">
      <h3>История</h3>
      <div class="header-actions">
        <button
          class="action-btn"
          onclick={clearAllHistory}
          title="Очистить историю"
          aria-label="Очистить историю"
        >
          <i class="ph ph-trash"></i>
        </button>
        <button
          class="action-btn close-btn"
          onclick={closePanel}
          title="Закрыть"
          aria-label="Закрыть"
        >
          <i class="ph ph-x"></i>
        </button>
      </div>
    </div>

    <div class="search-bar">
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Поиск в истории..."
        class="search-input"
      />
    </div>

    <div class="history-content">
      {#if filteredHistory.length === 0 && searchQuery}
        <div class="empty-state">
          <i class="ph ph-magnifying-glass empty-icon"></i>
          <p>Ничего не найдено</p>
          <p class="empty-hint">Попробуйте изменить запрос</p>
        </div>
      {:else if history.length === 0}
        <div class="empty-state">
          <i class="ph ph-magnifying-glass empty-icon"></i>
          <p>История пуста</p>
          <p class="empty-hint">Посетите несколько сайтов, чтобы увидеть историю</p>
        </div>
      {:else}
        <div class="history-list">
          {#each [...groupedHistory().entries()] as [dateGroup, entries] (dateGroup)}
            <div class="history-group">
              <div class="group-header">
                <h4>{dateGroup}</h4>
                <span class="group-count"
                  >{entries.length} {entries.length === 1 ? 'посещение' : 'посещений'}</span
                >
              </div>

              {#each entries as entry (entry.id)}
                <button
                  class="history-item"
                  onclick={() => openHistoryEntry(entry.url, entry.title)}
                  type="button"
                  aria-label="Открыть страницу: {entry.title}"
                >
                  <i class="ph ph-globe history-icon"></i>
                  <div class="history-info">
                    <div class="history-title">{entry.title}</div>
                    <div class="history-url">{entry.url}</div>
                    <div class="history-date">
                      Посещено: {formatDateTime(entry.visitedAt)} • Посещений: {entry.visitCount}
                    </div>
                  </div>
                </button>
              {/each}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .history-panel {
    position: fixed;
    top: calc(
      var(--tabbar-height) + var(--toolbar-height)
    ); /* Правильная высота: 44px + 45px = 89px */
    right: 0;
    width: 400px;
    height: calc(100vh - var(--tabbar-height) - var(--toolbar-height));
    background: var(--bg-primary);
    border-left: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    z-index: 1001; /* Увеличиваем z-index чтобы быть поверх webview'ов */
    box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-lg) var(--spacing-xl);
    border-bottom: 1px solid var(--border-color);
    background: var(--bg-secondary);
  }

  .panel-header h3 {
    margin: 0;
    color: var(--text-primary);
    font-size: 16px;
    font-weight: 600;
  }

  .header-actions {
    display: flex;
    gap: var(--spacing-sm);
  }

  .action-btn {
    width: var(--btn-size-small);
    height: var(--btn-size-small);
    border: none;
    border-radius: var(--btn-border-radius);
    background: var(--btn-bg);
    color: var(--text-primary);
    font-size: var(--btn-icon-size);
    cursor: default;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s ease;
  }

  .action-btn:hover {
    background: var(--btn-bg-hover);
  }

  .close-btn {
    font-size: 20px;
  }

  .search-bar {
    padding: var(--spacing-lg) var(--spacing-xl);
    border-bottom: 1px solid var(--border-color);
  }

  .search-input {
    width: 100%;
    height: 36px;
    padding: 0 var(--spacing-md);
    border: 1px solid var(--border-color);
    border-radius: var(--spacing-lg);
    background: var(--bg-secondary);
    color: var(--text-primary);
    font-size: var(--btn-font-size);
    outline: none;
    transition: border-color 0.2s ease;
  }

  .search-input:focus {
    border-color: var(--accent-color);
    box-shadow: 0 0 0 2px var(--accent-color-light);
  }

  .history-content {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-lg) 0;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 2rem;
    text-align: center;
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  .empty-state p {
    color: var(--text-secondary);
    margin-bottom: 0.5rem;
  }

  .empty-hint {
    font-size: 14px;
    opacity: 0.7;
  }

  .history-list {
    padding: 0 16px;
  }

  .history-group {
    margin-bottom: 24px;
  }

  .group-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
    padding: 8px 12px;
    background: var(--bg-secondary);
    border-radius: 8px;
    border: 1px solid var(--border-color);
  }

  .group-header h4 {
    margin: 0;
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 600;
  }

  .group-count {
    color: var(--text-secondary);
    font-size: 12px;
  }

  .history-item {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    margin-bottom: 4px;
    border-radius: 8px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    cursor: default;
    transition: all 0.2s ease;
    gap: var(--spacing-md);
    text-align: left;
    width: 100%;
  }

  .history-item:hover {
    background: var(--btn-bg-hover);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .history-icon {
    font-size: 18px;
    opacity: 0.7;
    flex-shrink: 0;
  }

  .history-info {
    flex: 1;
    min-width: 0;
  }

  .history-title {
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 14px;
  }

  .history-url {
    color: var(--text-secondary);
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .history-date {
    color: var(--text-secondary);
    font-size: 12px;
    margin-top: 4px;
  }

  /* Scrollbar */
  .history-content::-webkit-scrollbar {
    width: 8px;
  }

  .history-content::-webkit-scrollbar-track {
    background: transparent;
  }

  .history-content::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 4px;
  }

  .history-content::-webkit-scrollbar-thumb:hover {
    background: var(--text-secondary);
  }
</style>
