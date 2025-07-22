<script lang="ts">
  import { browserState } from '../stores/browser.svelte.js';

  // Заглушки для загрузок
  const downloads = [
    {
      id: '1',
      filename: 'document.pdf',
      url: 'https://example.com/document.pdf',
      progress: 100,
      size: '2.5 MB',
      status: 'completed',
      icon: '📄',
    },
    {
      id: '2',
      filename: 'image.jpg',
      url: 'https://example.com/image.jpg',
      progress: 45,
      size: '1.2 MB',
      status: 'downloading',
      icon: '🖼️',
    },
    {
      id: '3',
      filename: 'video.mp4',
      url: 'https://example.com/video.mp4',
      progress: 0,
      size: '15.7 MB',
      status: 'failed',
      icon: '🎥',
    },
  ];

  function openDownload(id: string) {
    console.log('Open download:', id);
  }

  function removeDownload(id: string) {
    console.log('Remove download:', id);
  }

  function retryDownload(id: string) {
    console.log('Retry download:', id);
  }

  function pauseDownload(id: string) {
    console.log('Pause download:', id);
  }
</script>

{#if browserState.showDownloads}
  <div class="downloads-panel">
    <div class="panel-header">
      <h3>Загрузки</h3>
      <button
        class="close-btn"
        onclick={() => (browserState.showDownloads = false)}
        aria-label="Закрыть панель загрузок"
      >
        <i class="ph ph-x"></i>
      </button>
    </div>

    <div class="downloads-list">
      {#if downloads.length === 0}
        <div class="empty-state">
          <i class="ph ph-download-simple"></i>
          <p>Нет загрузок</p>
        </div>
      {:else}
        {#each downloads as download}
          <div class="download-item">
            <div class="download-info">
              <span class="file-icon">{download.icon}</span>
              <div class="file-details">
                <div class="filename">{download.filename}</div>
                <div class="file-meta">
                  <span class="file-size">{download.size}</span>
                  <span
                    class="file-status"
                    class:completed={download.status === 'completed'}
                    class:downloading={download.status === 'downloading'}
                    class:failed={download.status === 'failed'}
                  >
                    {#if download.status === 'completed'}
                      Завершено
                    {:else if download.status === 'downloading'}
                      Загружается ({download.progress}%)
                    {:else if download.status === 'failed'}
                      Ошибка
                    {/if}
                  </span>
                </div>
                {#if download.status === 'downloading'}
                  <div class="progress-bar">
                    <div class="progress-fill" style="width: {download.progress}%"></div>
                  </div>
                {/if}
              </div>
            </div>

            <div class="download-actions">
              {#if download.status === 'completed'}
                <button
                  class="action-btn"
                  onclick={() => openDownload(download.id)}
                  title="Открыть"
                  aria-label="Открыть"
                >
                  <i class="ph ph-folder-open"></i>
                </button>
              {:else if download.status === 'downloading'}
                <button
                  class="action-btn"
                  onclick={() => pauseDownload(download.id)}
                  title="Пауза"
                  aria-label="Пауза"
                >
                  <i class="ph ph-pause"></i>
                </button>
              {:else if download.status === 'failed'}
                <button
                  class="action-btn"
                  onclick={() => retryDownload(download.id)}
                  title="Повторить"
                  aria-label="Повторить"
                >
                  <i class="ph ph-arrow-clockwise"></i>
                </button>
              {/if}
              <button
                class="action-btn danger"
                onclick={() => removeDownload(download.id)}
                title="Удалить"
                aria-label="Удалить"
              >
                <i class="ph ph-trash"></i>
              </button>
            </div>
          </div>
        {/each}
      {/if}
    </div>

    <div class="panel-footer">
      <button class="clear-all-btn" aria-label="Очистить всё">
        <i class="ph ph-trash"></i>
        Очистить всё
      </button>
    </div>
  </div>
{/if}

<style>
  .downloads-panel {
    position: absolute;
    top: 100%;
    right: 100px;
    width: 400px;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    z-index: 1000;
    max-height: 500px;
    overflow-y: auto;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-lg);
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

  .downloads-list {
    padding: var(--spacing-sm);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 32px;
    color: var(--text-secondary);
  }

  .empty-state i {
    font-size: 48px;
    margin-bottom: 12px;
    opacity: 0.5;
  }

  .download-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-md);
    border-radius: var(--btn-border-radius);
    transition: background-color 0.2s ease;
    gap: var(--spacing-md);
  }

  .download-item:hover {
    background: var(--btn-bg-hover);
  }

  .download-info {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    flex: 1;
    min-width: 0;
  }

  .file-icon {
    font-size: 24px;
    flex-shrink: 0;
  }

  .file-details {
    flex: 1;
    min-width: 0;
  }

  .filename {
    font-size: 14px;
    color: var(--text-primary);
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .file-meta {
    display: flex;
    gap: var(--spacing-sm);
    margin-top: var(--spacing-xs);
    font-size: 12px;
  }

  .file-size {
    color: var(--text-secondary);
  }

  .file-status {
    color: var(--text-secondary);
  }

  .file-status.completed {
    color: #10b981;
  }

  .file-status.downloading {
    color: var(--accent-color);
  }

  .file-status.failed {
    color: #ef4444;
  }

  .progress-bar {
    width: 100%;
    height: var(--spacing-xs);
    background: var(--bg-secondary);
    border-radius: 2px;
    margin-top: var(--spacing-sm);
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: var(--accent-color);
    border-radius: 2px;
    transition: width 0.3s ease;
  }

  .download-actions {
    display: flex;
    gap: var(--spacing-sm);
    flex-shrink: 0;
  }

  .action-btn {
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
    transition: all 0.2s ease;
  }

  .action-btn:hover {
    background: var(--btn-bg-hover);
    color: var(--text-primary);
  }

  .action-btn.danger:hover {
    color: #ef4444;
  }

  .panel-footer {
    padding: var(--spacing-lg);
    border-top: 1px solid var(--border-color);
  }

  .clear-all-btn {
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--border-color);
    background: transparent;
    color: var(--text-secondary);
    border-radius: 6px;
    cursor: default;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    font-size: var(--btn-font-size);
    transition: all 0.2s ease;
  }

  .clear-all-btn:hover {
    border-color: #ef4444;
    color: #ef4444;
  }
</style>
