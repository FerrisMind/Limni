<script lang="ts">
  import {
    bookmarks,
    removeBookmark,
    addBookmark,
    getActiveTab,
    updateTabUrl,
  } from '../stores/browser.svelte.js';
  import { browserState } from '../stores/browser.svelte.js';

  function openBookmark(url: string, title: string) {
    const activeTab = getActiveTab();
    if (activeTab) {
      updateTabUrl(activeTab.id, url, title);
    }
  }

  function deleteBookmark(bookmarkId: string) {
    removeBookmark(bookmarkId);
  }

  function addCurrentPageToBookmarks() {
    const activeTab = getActiveTab();
    if (activeTab && activeTab.url !== 'about:blank') {
      addBookmark(activeTab.title, activeTab.url);
    }
  }

  function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  function closePanel() {
    browserState.showBookmarks = false;
  }
</script>

{#if browserState.showBookmarks}
  <div class="bookmarks-panel">
    <div class="panel-header">
      <h3>Закладки</h3>
      <div class="header-actions">
        <button
          class="action-btn"
          onclick={addCurrentPageToBookmarks}
          title="Добавить текущую страницу"
          aria-label="Добавить текущую страницу"
        >
          <i class="ph ph-star"></i>
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

    <div class="bookmarks-content">
      {#if bookmarks.length === 0}
        <div class="empty-state">
          <i class="ph ph-books empty-icon"></i>
          <p class="empty-message">Нет сохраненных закладок</p>
          <p class="empty-hint">
            Нажмите <i class="ph ph-star"></i> чтобы добавить текущую страницу в закладки
          </p>
        </div>
      {:else}
        <div class="bookmarks-list">
          {#each bookmarks as bookmark (bookmark.id)}
            <button
              class="bookmark-item"
              onclick={() => openBookmark(bookmark.url, bookmark.title)}
            >
              <i class="ph ph-globe bookmark-icon"></i>
              <div class="bookmark-info">
                <div class="bookmark-title">{bookmark.title}</div>
                <div class="bookmark-url">{bookmark.url}</div>
                <div class="bookmark-date">Добавлено: {formatDate(bookmark.createdAt)}</div>
              </div>
            </button>
            <button
              class="bookmark-delete"
              onclick={() => deleteBookmark(bookmark.id)}
              title="Удалить закладку"
              aria-label="Удалить закладку"
            >
              <i class="ph ph-trash"></i>
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .bookmarks-panel {
    position: fixed;
    top: calc(
      var(--tabbar-height) + var(--toolbar-height)
    ); /* Правильная высота: 44px + 45px = 89px */
    left: 0;
    width: 352px;
    height: calc(100vh - var(--tabbar-height) - var(--toolbar-height));
    background: var(--bg-primary);
    border-right: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    z-index: 1001; /* Увеличиваем z-index чтобы быть поверх webview'ов */
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
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

  .bookmarks-content {
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

  .bookmarks-list {
    padding: 0 var(--spacing-lg);
  }

  .bookmark-item {
    display: flex;
    align-items: center;
    margin-bottom: var(--spacing-sm);
    border-radius: var(--btn-border-radius);
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    transition: all 0.2s ease;
  }

  .bookmark-item:hover {
    background: var(--btn-bg-hover);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .bookmark-icon {
    font-size: 20px;
    opacity: 0.7;
    flex-shrink: 0;
  }

  .bookmark-info {
    flex: 1;
    min-width: 0;
  }

  .bookmark-title {
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 14px;
  }

  .bookmark-url {
    color: var(--text-secondary);
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 4px;
  }

  .bookmark-date {
    color: var(--text-secondary);
    font-size: 12px;
    opacity: 0.7;
  }

  .bookmark-delete {
    width: 36px;
    height: 36px;
    border: none;
    background: transparent;
    cursor: default;
    font-size: var(--btn-font-size);
    opacity: 0;
    transition: all 0.2s ease;
    flex-shrink: 0;
    margin-right: var(--spacing-sm);
    border-radius: var(--btn-border-radius);
  }

  .bookmark-delete:hover {
    background: var(--btn-bg-hover);
    transform: scale(1.1);
  }

  /* Scrollbar */
  .bookmarks-content::-webkit-scrollbar {
    width: 8px;
  }

  .bookmarks-content::-webkit-scrollbar-track {
    background: transparent;
  }

  .bookmarks-content::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 4px;
  }

  .bookmarks-content::-webkit-scrollbar-thumb:hover {
    background: var(--text-secondary);
  }
</style>
