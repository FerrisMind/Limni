<script lang="ts">
  import { browser } from '../stores/browser.svelte';

  let inputValue = $state('');
  let inputElement: HTMLInputElement;
  let originalValue = '';

  // Реактивно обновляем значение при изменении активной вкладки
  $effect(() => {
    if (browser.currentTab?.url) {
      inputValue = browser.currentTab.url;
      originalValue = browser.currentTab.url;
    }
  });

  // Обработчик события фокуса от глобальных горячих клавиш
  function handleFocusEvent() {
    if (inputElement) {
      inputElement.focus();
      inputElement.select();
      console.log('🎯 AddressBar: получен фокус от горячих клавиш');
    }
  }

  // Добавляем слушатель custom event для фокуса
  $effect(() => {
    document.addEventListener('focusAddressBar', handleFocusEvent);

    // Очистка при размонтировании
    return () => {
      document.removeEventListener('focusAddressBar', handleFocusEvent);
    };
  });

  // Проверка является ли строка IP адресом
  function isIPAddress(str: string): boolean {
    const ipRegex =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(str);
  }

  // Проверка является ли строка URL
  function isURL(str: string): boolean {
    if (str.includes('://')) return true;
    if (isIPAddress(str)) return true;
    if (str.includes('.') && !str.includes(' ')) return true;
    if (str.includes(':') && str.split(':').length === 2) return true;
    return false;
  }

  // Нормализация URL
  function normalizeURL(input: string): string {
    if (input.includes('://')) return input;
    if (isIPAddress(input)) return `http://${input}`;
    if (input.includes(':') && input.split(':').length === 2) {
      return `http://${input}`;
    }
    if (input.includes('.') && !input.includes(' ')) {
      return `https://${input}`;
    }
    return input;
  }

  // Обработка навигации
  async function handleNavigate() {
    if (!inputValue.trim() || !browser.currentTab) return;

    const trimmedInput = inputValue.trim();

    if (isURL(trimmedInput)) {
      const url = normalizeURL(trimmedInput);
      await browser.updateTabUrl(browser.currentTab.id, url);
    } else {
      // Поисковый запрос
      const searchQuery = encodeURIComponent(trimmedInput);
      const searchUrl = `https://www.google.com/search?q=${searchQuery}`;
      await browser.updateTabUrl(browser.currentTab.id, searchUrl);
    }
  }

  // Обработка нажатий клавиш
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleNavigate();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      inputValue = originalValue;
      inputElement.blur();
    }
  }

  // Обработка фокуса
  function handleFocus() {
    inputElement.select();
  }

  // Обработка потери фокуса
  function handleBlur() {
    if (inputValue !== originalValue) {
      inputValue = originalValue;
    }
  }

  // Обработка вставки
  async function handlePaste(event: ClipboardEvent) {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';

    if (pastedText.trim()) {
      inputValue = pastedText.trim();

      // Paste and Go для URL и IP адресов
      if (isURL(pastedText.trim())) {
        await handleNavigate();
      }
    }
  }
</script>

<div class="address-bar">
  <div class="address-input-container">
    <div class="address-icon">
      <i class="ph ph-globe"></i>
    </div>
    <input
      bind:this={inputElement}
      bind:value={inputValue}
      type="text"
      class="address-input"
      placeholder="Поиск в Google или введите URL"
      onkeydown={handleKeydown}
      onfocus={handleFocus}
      onblur={handleBlur}
      onpaste={handlePaste}
    />
    <button class="go-btn" onclick={handleNavigate} title="Перейти" aria-label="Перейти">
      <i class="ph ph-arrow-right"></i>
    </button>
  </div>
</div>

<style>
  .address-bar {
    flex: 1;
    width: 100%;
    margin: var(--spacing-xs) 0; /* 4px отступы сверху и снизу согласно 4px сетке */
  }

  .address-input-container {
    display: flex;
    align-items: center;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--btn-border-radius);
    padding: 0;
    height: 32px;
    margin: var(--spacing-xs) 0; /* 4px отступы сверху и снизу согласно 4px сетке */
  }

  .address-input-container:focus-within {
    border-color: var(--accent-color);
    box-shadow: 0 0 0 2px rgba(var(--accent-color-rgb), 0.2);
  }

  .address-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 var(--spacing-sm); /* 8px горизонтальные отступы */
    color: var(--text-primary);
    font-size: 16px;
  }

  .address-input {
    flex: 1;
    border: none;
    background: transparent;
    color: var(--text-primary);
    font-size: 14px;
    padding: var(--spacing-sm) var(--spacing-xs); /* 8px вертикально, 4px горизонтально */
    outline: none;
    font-family: inherit;
  }

  .address-input::placeholder {
    color: var(--text-secondary);
  }

  .go-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: var(--text-primary);
    padding: var(--spacing-sm); /* 8px отступы согласно переменной */
    cursor: default;
    border-radius: var(--btn-border-radius);
    margin-right: var(--spacing-xs); /* 4px правый отступ согласно 4px сетке */
    font-size: 14px;
  }

  .go-btn:hover {
    background: var(--btn-bg-hover);
    color: var(--text-primary);
    padding: var(--spacing-sm); /* Согласованный размер ховера */
  }
</style>
