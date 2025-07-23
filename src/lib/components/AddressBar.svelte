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
    try {
      // Использование встроенного URL API для более надежной валидации
      const url = new URL(str.includes('://') ? str : `https://${str}`); // Пробуем добавить https:// для парсинга
      return ['http:', 'https:', 'file:'].includes(url.protocol);
    } catch {
      // Если URL API не может распарсить, это не валидный URL
      return false;
    }
  }

  // Нормализация URL
  function normalizeURL(input: string): string {
    // Декодируем, если строка уже содержит escape-последовательности, чтобы избежать двойного кодирования
    let processedInput = decodeURIComponent(input);

    try {
      // Проверяем, если строка уже является валидным URL с протоколом
      if (processedInput.includes('://')) {
        const url = new URL(processedInput);
        if (url.protocol === 'file:' || url.protocol === 'http:' || url.protocol === 'https:') {
          // Для file://, http://, https:// URL используем toASCIIString для Punycode, если необходимо
          return url.protocol === 'file:' ? url.toString() : url.hostname.includes('xn--') ? url.toString() : new URL(url.toString()).href;
        }
      }

      // Если это IP-адрес, добавляем http://
      if (isIPAddress(processedInput)) {
        return `http://${processedInput}`;
      }

      // Если это localhost с портом или домен с портом, добавляем http://
      if (processedInput.includes(':') && processedInput.split(':').length === 2 && !processedInput.includes('/')) {
        const [host, port] = processedInput.split(':');
        // Проверяем, является ли хост валидным доменом или IP перед добавлением протокола
        // Избегаем Punycode для host, если это не доменное имя (например, just-a-name:8080)
        return `http://${new URL(`http://${host}`).hostname}:${port}`;
      }

      // Для остальных случаев предполагаем HTTPS и применяем Punycode
      // Сначала пытаемся создать URL, чтобы корректно обработать доменное имя
      const tempUrl = new URL(`https://${processedInput}`);
      return tempUrl.href;
    } catch (error) {
      console.error('Ошибка нормализации URL:', error);
      // В случае ошибки возвращаем исходный ввод, чтобы не ломать поиск
      return input;
    }
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
    margin: var(--spacing-4px) 0; /* 4px отступы сверху и снизу согласно 4px сетке */
  }

  .address-input-container {
    display: flex;
    align-items: center;
    background: var(--bg-secondary);
    border: var(--input-border-width-1px) solid var(--border-color);
    border-radius: var(--input-border-radius-4px);
    padding: 0;
    height: var(--input-height-32px);
    margin: var(--spacing-4px) 0; /* 4px отступы сверху и снизу согласно 4px сетке */
  }

  .address-input-container:focus-within {
    border-color: var(--accent-color);
    box-shadow: 0 0 0 var(--input-focus-outline-2px) var(--accent-color-light);
  }

  .address-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 var(--spacing-8px); /* 8px горизонтальные отступы */
    color: var(--text-primary);
    font-size: var(--icon-size-16px);
  }

  .address-input {
    flex: 1;
    border: none;
    background: transparent;
    color: var(--text-primary);
    font-size: var(--font-size-14px);
    padding: var(--spacing-8px) var(--spacing-4px); /* 8px вертикально, 4px горизонтально */
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
    padding: var(--spacing-8px); /* 8px отступы согласно переменной */
    cursor: default;
    border-radius: var(--button-border-radius-8px);
    margin-right: var(--spacing-4px); /* 4px правый отступ согласно 4px сетке */
    font-size: var(--font-size-14px);
  }

  .go-btn:hover {
    background: var(--btn-bg-hover);
    color: var(--text-primary);
    padding: var(--spacing-8px); /* Согласованный размер ховера */
  }
</style>
