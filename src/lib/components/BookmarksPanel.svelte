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
    width: 352px; /* Пока оставляем как есть, потребуется более детальный расчет */
    height: calc(100vh - var(--tabbar-height) - var(--toolbar-height));
    background: var(--bg-primary);
    border-right: var(--card-border-width-1px) solid var(--border-color);
    display: flex;
    flex-direction: column;
    z-index: 1001; /* Увеличиваем z-index чтобы быть поверх webview'ов */
    box-shadow: var(--shadow-sm); /* Изменено на shadow-sm */
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-16px) var(--spacing-24px); /* Соответствует 4px сетке: 16px вертикаль, 24px горизонталь */
    border-bottom: var(--card-border-width-1px) solid var(--border-color);
    background: var(--bg-secondary);
  }

  .panel-header h3 {
    margin: 0;
    color: var(--text-primary);
    font-size: var(--font-size-16px);
    font-weight: 600;
  }

  .header-actions {
    display: flex;
    gap: var(--spacing-8px);
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

  .close-btn {
    font-size: var(--icon-size-20px);
  }

  .bookmarks-content {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-16px) 0;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: var(--spacing-32px); /* 2rem = 32px */
    text-align: center;
  }

  .empty-icon {
    font-size: var(--icon-size-48px); /* 3rem = 48px */
    margin-bottom: var(--spacing-16px); /* 1rem = 16px */
    opacity: 0.5;
  }

  .empty-state p {
    color: var(--text-secondary);
    margin-bottom: var(--spacing-8px); /* 0.5rem = 8px */
  }

  .empty-hint {
    font-size: var(--font-size-14px);
    opacity: 0.7;
  }

  .bookmarks-list {
    padding: 0 var(--spacing-16px);
  }

  .bookmark-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-12px); /* Добавлен gap */
    padding: var(--spacing-12px) var(--spacing-16px); /* Соответствует 4px сетке */
    margin-bottom: var(--spacing-4px); /* Отступ между элементами списка */
    border-radius: var(--card-border-radius-8px);
    background: var(--bg-secondary);
    border: var(--card-border-width-1px) solid var(--border-color);
    transition: all 0.2s ease;
  }

  .bookmark-item:hover {
    background: var(--btn-bg-hover);
    transform: translateY(0px); /* Было -1px, изменено на 0px для 8px сетки */
    box-shadow: var(--shadow-sm);
  }

  .bookmark-icon {
    font-size: var(--icon-size-20px);
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
    margin-bottom: var(--spacing-4px); /* Было 8px, изменено на 4px для 4px сетки */
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: var(--font-size-14px);
  }

  .bookmark-url {
    color: var(--text-secondary);
    font-size: var(--font-size-12px);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: var(--spacing-4px); /* Было 8px, изменено на 4px для 4px сетки */
  }

  .bookmark-date {
    color: var(--text-secondary);
    font-size: var(--font-size-12px);
    opacity: 0.7;
  }

  .bookmark-delete {
    width: var(--button-height-medium); /* Было 32px, теперь 32px */
    height: var(--button-height-medium); /* Было 32px, теперь 32px */
    border: none;
    background: transparent;
    cursor: default;
    font-size: var(--icon-size-16px); /* Используем icon-size-16px */
    opacity: 0;
    transition: all 0.2s ease;
    flex-shrink: 0;
    margin-right: var(--spacing-8px); /* Отступ от края */
    border-radius: var(--button-border-radius-8px);
  }

  .bookmark-delete:hover {
    background: var(--btn-bg-hover);
    transform: scale(1.1);
  }

  /* Scrollbar */
  .bookmarks-content::-webkit-scrollbar {
    width: var(--spacing-8px);
  }

  .bookmarks-content::-webkit-scrollbar-track {
    background: transparent;
  }

  .bookmarks-content::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: var(--radius-sm);
  }

  .bookmarks-content::-webkit-scrollbar-thumb:hover {
    background: var(--text-secondary);
  }
</style>
