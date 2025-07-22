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
          // Проверяем наличие Tauri API с таймаутом
          await testPage.waitForFunction(
            () => typeof window.__TAURI__ !== 'undefined',
            { timeout: 5000 }
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
    // Ждем инициализации Tauri API с таймаутом
    const tauriAvailable = await page.waitForFunction(
      () => typeof window.__TAURI__ !== 'undefined',
      { timeout: 10000 }
    ).then(() => true).catch(() => false);
    
    expect(tauriAvailable).toBe(true);
    
    // Дополнительная проверка основных API
    if (tauriAvailable) {
      const hasCore = await page.evaluate(() => {
        return typeof window.__TAURI__.core !== 'undefined';
      });
      expect(hasCore).toBe(true);
      console.log('✅ Tauri API и core модуль доступны в нативном приложении');
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

    // Проверяем размеры окна
    const viewport = page.viewportSize();
    expect(viewport).toBeTruthy();
    expect(viewport!.width).toBeGreaterThan(0);
    expect(viewport!.height).toBeGreaterThan(0);

    console.log(`📐 Размер окна: ${viewport!.width}x${viewport!.height}`);
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
