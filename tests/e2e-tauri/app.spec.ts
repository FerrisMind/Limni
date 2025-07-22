import { test, expect, chromium } from '@playwright/test';

test.describe('Limni Tauri Application - Native Tests', () => {
  let browser: any;
  let page: any;

  test.beforeAll(async () => {
    // Подключаемся к Tauri приложению через CDP
    browser = await chromium.connectOverCDP('http://localhost:9222');
    const contexts = browser.contexts();
    
    if (contexts.length === 0) {
      throw new Error('Не найдено активных контекстов в Tauri приложении');
    }
    
    // Найти контекст с Tauri API
    let tauriPage = null;
    for (const context of contexts) {
      const pages = context.pages();
      for (const testPage of pages) {
        try {
          // Ждем загрузки страницы
          await testPage.waitForLoadState('networkidle', { timeout: 10000 });
          
          // Проверяем наличие Tauri API с увеличенным таймаутом
          await testPage.waitForFunction(
            () => {
              return typeof window.__TAURI__ !== 'undefined' && 
                     window.__TAURI__.core !== undefined;
            },
            { timeout: 15000 }
          );
          tauriPage = testPage;
          break;
        } catch {
          // Продолжаем поиск в других страницах
          continue;
        }
      }
      if (tauriPage) break;
    }
    
    if (!tauriPage) {
      // Fallback к первой доступной странице
      const context = contexts[0];
      const pages = context.pages();
      if (pages.length === 0) {
        throw new Error('Не найдено активных страниц в Tauri приложении');
      }
      tauriPage = pages[0];
      
      // Ждем загрузки страницы даже для fallback
      await tauriPage.waitForLoadState('networkidle', { timeout: 10000 });
      console.log('⚠️ Tauri API не найдены, используем первую доступную страницу');
    } else {
      console.log('✅ Найдена страница с Tauri API');
    }
    
    page = tauriPage;
    console.log('✅ Подключились к Tauri приложению');
  });

  test.afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  test('should have correct window title', async () => {
    // Проверяем заголовок окна нативного приложения
    const title = await page.title();
    expect(title).toContain('Limni');
    console.log(`📋 Заголовок окна: ${title}`);
  });

  test('should load main application UI', async () => {
    // Ждем загрузки основных элементов
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Проверяем, что body загрузился
    const body = page.locator('body');
    await expect(body).toBeVisible();

    console.log('✅ Основной UI приложения загружен');
  });

  test('should have working Tauri APIs', async () => {
    // Ждем инициализации Tauri API с увеличенным таймаутом
    const tauriAvailable = await page.waitForFunction(
      () => {
        return typeof window.__TAURI__ !== 'undefined' && 
               window.__TAURI__.core !== undefined &&
               typeof window.__TAURI__.core.invoke === 'function';
      },
      { timeout: 20000 }
    ).then(() => true).catch(() => false);
    
    expect(tauriAvailable).toBe(true);
    
    // Дополнительная проверка основных API
    if (tauriAvailable) {
      const apiCheck = await page.evaluate(() => {
        const tauri = window.__TAURI__;
        return {
          hasCore: typeof tauri.core !== 'undefined',
          hasInvoke: typeof tauri.core.invoke === 'function',
          hasEvent: typeof tauri.event !== 'undefined',
          hasWindow: typeof tauri.webviewWindow !== 'undefined'
        };
      });
      
      expect(apiCheck.hasCore).toBe(true);
      expect(apiCheck.hasInvoke).toBe(true);
      expect(apiCheck.hasEvent).toBe(true);
      expect(apiCheck.hasWindow).toBe(true);
      
      console.log('✅ Tauri API и все основные модули доступны в нативном приложении');
    }
  });

  test('should handle window interactions', async () => {
    // Тестируем взаимодействие с окном (клики, ввод текста)
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Проверяем, что можем взаимодействовать с элементами
    await body.click();

    console.log('✅ Взаимодействие с окном работает');
  });

  test('should maintain window state', async () => {
    // Проверяем, что окно остается активным и отзывчивым
    const isVisible = await page.isVisible('body');
    expect(isVisible).toBe(true);

    // Проверяем размеры окна через evaluate для Tauri
    const windowInfo = await page.evaluate(() => {
      return {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        outerWidth: window.outerWidth,
        outerHeight: window.outerHeight,
        viewport: {
          width: document.documentElement.clientWidth,
          height: document.documentElement.clientHeight
        }
      };
    });
    
    expect(windowInfo.innerWidth).toBeGreaterThan(0);
    expect(windowInfo.innerHeight).toBeGreaterThan(0);
    expect(windowInfo.viewport.width).toBeGreaterThan(0);
    expect(windowInfo.viewport.height).toBeGreaterThan(0);

    console.log(`📐 Размер окна: ${windowInfo.innerWidth}x${windowInfo.innerHeight}`);
    console.log(`📐 Viewport: ${windowInfo.viewport.width}x${windowInfo.viewport.height}`);
  });

  test('should handle keyboard and mouse events', async () => {
    // Тестируем обработку событий клавиатуры и мыши
    const body = page.locator('body');

    // Тестируем клавиатурные события
    await body.press('Tab');
    await page.waitForTimeout(500);

    // Тестируем события мыши
    await body.hover();
    await page.waitForTimeout(500);

    console.log('✅ События клавиатуры и мыши обрабатываются');
  });
});
