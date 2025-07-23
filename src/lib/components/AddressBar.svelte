<script lang="ts">
  import { browser, setTabError } from '../stores/browser.svelte.js';

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

  // Расширенная валидация URL для обнаружения потенциально некорректных адресов
  async function isValidURL(str: string): Promise<{ isValid: boolean; errorType?: string; errorMessage?: string }> {
    const trimmed = str.trim();
    
    // Проверка на пустую строку
    if (!trimmed) {
      return { isValid: false, errorType: 'empty', errorMessage: 'Адрес не может быть пустым' };
    }
    
    // Проверка на недопустимые символы
    const invalidChars = /[<>"{}|\\^`\[\]]/;
    if (invalidChars.test(trimmed)) {
      return { isValid: false, errorType: 'invalid-chars', errorMessage: 'Адрес содержит недопустимые символы' };
    }
    
    // Проверка на слишком длинный URL (более 2048 символов)
    if (trimmed.length > 2048) {
      return { isValid: false, errorType: 'too-long', errorMessage: 'Адрес слишком длинный' };
    }
    
    try {
      const testUrl = trimmed.includes('://') ? trimmed : `https://${trimmed}`;
      const url = new URL(testUrl);
      
      // Проверка поддерживаемых протоколов
      if (!['http:', 'https:', 'file:'].includes(url.protocol)) {
        return { isValid: false, errorType: 'unsupported-protocol', errorMessage: `Протокол ${url.protocol} не поддерживается` };
      }
      
      // Проверка валидности хоста для http/https
      if (['http:', 'https:'].includes(url.protocol)) {
        if (!url.hostname || url.hostname.length === 0) {
          return { isValid: false, errorType: 'invalid-hostname', errorMessage: 'Некорректное имя хоста' };
        }
        
        // Проверка на недопустимые символы в хосте
        if (!/^[a-zA-Z0-9.-]+$/.test(url.hostname.replace(/\[[0-9a-fA-F:]+\]/, 'ipv6'))) {
          return { isValid: false, errorType: 'invalid-hostname', errorMessage: 'Некорректное имя хоста' };
        }
        
        // Проверка существования домена через DNS lookup
        if (!isLocalhost(url.hostname) && !isIPAddress(url.hostname)) {
          try {
            const dnsResult = await checkDomainExists(url.hostname);
            if (!dnsResult) {
              return { isValid: false, errorType: 'domain-not-found', errorMessage: 'Домен не найден' };
            }
          } catch (error) {
            return { isValid: false, errorType: 'dns-error', errorMessage: 'Ошибка проверки домена' };
          }
        }
      }
      
      return { isValid: true };
    } catch (error) {
      return { isValid: false, errorType: 'malformed', errorMessage: 'Некорректный формат адреса' };
    }
  }

  // Проверка, является ли хост localhost
  function isLocalhost(hostname: string): boolean {
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  }

  // Проверка, является ли хост IP-адресом
  function isIPAddress(hostname: string): boolean {
    // IPv4
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    // IPv6 (упрощенная проверка)
    const ipv6Regex = /^\[[0-9a-fA-F:]+\]$|^[0-9a-fA-F:]+$/;
    return ipv4Regex.test(hostname) || ipv6Regex.test(hostname);
  }

  // Проверка существования домена через DNS
  async function checkDomainExists(hostname: string): Promise<boolean> {
    try {
      // Используем простой HTTP запрос для проверки доступности домена
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 секунд таймаут
      
      const response = await fetch(`https://${hostname}`, {
        method: 'HEAD',
        signal: controller.signal,
        mode: 'no-cors' // Избегаем CORS ошибок
      });
      
      clearTimeout(timeoutId);
      return true; // Если запрос прошел без ошибок, домен существует
    } catch (error) {
      // Если ошибка связана с сетью или DNS, домен не существует
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

    // Проверяем, похоже ли на URL (содержит точку, двоеточие или слэш)
    const looksLikeURL = /[.:\/]/.test(trimmedInput) || trimmedInput.includes('localhost') || /^\d+\.\d+\.\d+\.\d+/.test(trimmedInput);
    
    if (looksLikeURL) {
      // Выполняем расширенную валидацию
      const validation = await isValidURL(trimmedInput);
      
      if (validation.isValid) {
        // URL валиден, нормализуем и переходим
        const url = normalizeURL(trimmedInput);
        await browser.updateTabUrl(browser.currentTab.id, url);
      } else {
        // URL невалиден, создаем страницу ошибки
        await handleInvalidURL(trimmedInput, validation.errorType, validation.errorMessage);
      }
    } else {
      // Не похоже на URL - выполняем поиск
      const searchQuery = encodeURIComponent(trimmedInput);
      const searchUrl = `https://www.google.com/search?q=${searchQuery}`;
      await browser.updateTabUrl(browser.currentTab.id, searchUrl);
    }
  }

  // Обработка невалидного URL
  async function handleInvalidURL(originalInput: string, errorType?: string, errorMessage?: string) {
    if (!browser.currentTab) return;
    
    // Создаем HTML страницу ошибки
    const errorPageHtml = createErrorPageHTML(originalInput, errorType, errorMessage);
    
    // Создаем data URL для отображения страницы ошибки
    const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(errorPageHtml)}`;
    
    // Устанавливаем ошибку в табе
    setTabError(browser.currentTab.id, errorMessage || `Невалидный URL: ${originalInput}`);
    
    // Переходим на страницу ошибки
    await browser.updateTabUrl(browser.currentTab.id, dataUrl);
  }

  // Создание HTML для страницы ошибки
  function createErrorPageHTML(originalInput: string, errorType?: string, errorMessage?: string): string {
    const title = getErrorTitle(errorType);
    const description = getErrorDescription(errorType, originalInput);
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(originalInput)}`;
    
    return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ошибка: ${title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        }
        .error-container {
            background: white;
            border-radius: 16px;
            padding: 3rem 2rem;
            max-width: 500px;
            text-align: center;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            border: 1px solid #e2e8f0;
        }
        .error-icon {
            margin-bottom: 1.5rem;
        }
        .error-title {
            font-size: 1.875rem;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 1rem;
        }
        .error-description {
            font-size: 1.125rem;
            color: #6b7280;
            margin-bottom: 2rem;
            line-height: 1.6;
        }
        .error-details {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 2rem;
        }
        .error-message {
            color: #dc2626;
            font-size: 0.875rem;
            font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace;
        }
        .error-actions {
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: wrap;
        }
        .action-button {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            font-weight: 500;
            font-size: 0.875rem;
            text-decoration: none;
            border: none;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .action-button.primary {
            background: #3b82f6;
            color: white;
        }
        .action-button.primary:hover {
            background: #2563eb;
            transform: translateY(-1px);
        }
        .action-button.secondary {
            background: #f8fafc;
            color: #475569;
            border: 1px solid #e2e8f0;
        }
        .action-button.secondary:hover {
            background: #f1f5f9;
            border-color: #cbd5e1;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <div class="error-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#f59e0b"/>
            </svg>
        </div>
        <h1 class="error-title">${title}</h1>
        <p class="error-description">${description}</p>
        ${errorMessage ? `
        <div class="error-details">
            <p class="error-message">${errorMessage}</p>
        </div>` : ''}
        <div class="error-actions">
            <a href="${searchUrl}" class="action-button primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/>
                </svg>
                Найти в Google
            </a>
            <a href="https://www.google.com" class="action-button secondary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="currentColor"/>
                </svg>
                На главную
            </a>
        </div>
    </div>
</body>
</html>`;
  }

  // Получение заголовка ошибки
  function getErrorTitle(errorType?: string): string {
    switch (errorType) {
      case 'empty': return 'Пустой адрес';
      case 'invalid-chars': return 'Недопустимые символы';
      case 'too-long': return 'Слишком длинный адрес';
      case 'unsupported-protocol': return 'Неподдерживаемый протокол';
      case 'invalid-hostname': return 'Некорректный хост';
      case 'malformed': return 'Неверный формат';
      default: return 'Неверный адрес';
    }
  }

  // Получение описания ошибки
  function getErrorDescription(errorType?: string, originalInput?: string): string {
    switch (errorType) {
      case 'empty': return 'Введите адрес веб-сайта или поисковый запрос.';
      case 'invalid-chars': return `Адрес "${originalInput}" содержит недопустимые символы.`;
      case 'too-long': return 'Введенный адрес превышает максимально допустимую длину.';
      case 'unsupported-protocol': return 'Данный протокол не поддерживается браузером.';
      case 'invalid-hostname': return `Имя хоста "${originalInput}" некорректно.`;
      case 'malformed': return `Адрес "${originalInput}" имеет неверный формат.`;
      default: return `Адрес "${originalInput}" не является корректным URL.`;
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
    margin: var(--spacing-4px) 0; /* Возвращено к 4px согласно 4px сетке */
  }

  .address-input-container {
    display: flex;
    align-items: center;
    background: var(--bg-secondary);
    border: var(--input-border-width-1px) solid var(--border-color);
    border-radius: var(--input-border-radius-4px);
    padding: 0;
    height: var(--input-height-32px);
    margin: var(--spacing-4px) 0; /* Возвращено к 4px согласно 4px сетке */
  }

  .address-input-container:focus-within {
    border-color: var(--accent-color);
    box-shadow: 0 0 0 var(--input-focus-outline-2px) var(--accent-color-light);
  }

  .address-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 var(--spacing-8px); /* Возвращено к 8px согласно 4px сетке */
    color: var(--text-primary);
    font-size: var(--icon-size-16px);
  }

  .address-input {
    flex: 1;
    border: none;
    background: transparent;
    color: var(--text-primary);
    font-size: var(--font-size-14px);
    padding: var(--spacing-8px) var(--spacing-4px); /* Возвращено к 8px вертикально согласно 4px сетке */
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
    padding: var(--spacing-8px); /* Возвращено к 8px согласно 4px сетке */
    cursor: default;
    border-radius: var(--button-border-radius-8px);
    margin-right: var(--spacing-4px); /* Возвращено к 4px согласно 4px сетке */
    font-size: var(--font-size-14px);
  }

  .go-btn:hover {
    background: var(--btn-bg-hover);
    color: var(--text-primary);
    padding: var(--spacing-8px); /* Возвращено к 8px согласно 4px сетке */
  }
</style>
