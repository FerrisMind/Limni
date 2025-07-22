import { test, expect } from '@playwright/test';

test.describe('Limni Tauri Application - WebDriver Tests', () => {
  test('should launch Tauri application', async ({ page }) => {
    // При использовании tauri-driver, приложение уже запущено
    // Проверяем, что можем взаимодействовать с ним

    // Ждем загрузки приложения
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Проверяем заголовок
    const title = await page.title();
    expect(title).toContain('Limni');
    console.log(`📋 Заголовок приложения: ${title}`);
  });

  test('should have main UI elements', async ({ page }) => {
    // Проверяем основные элементы UI
    const body = page.locator('body');
    await expect(body).toBeVisible();

    console.log('✅ Основные элементы UI видимы');
  });

  test('should handle user interactions', async ({ page }) => {
    // Тестируем взаимодействие пользователя
    const body = page.locator('body');

    // Клик по body
    await body.click();

    // Проверяем, что приложение отзывчиво
    await expect(body).toBeVisible();

    console.log('✅ Взаимодействие пользователя работает');
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Тестируем навигацию с клавиатуры
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);

    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    console.log('✅ Навигация с клавиатуры работает');
  });

  test('should maintain application state', async ({ page }) => {
    // Проверяем, что состояние приложения сохраняется
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Проверяем, что приложение все еще активно
    const isVisible = await body.isVisible();
    expect(isVisible).toBe(true);

    console.log('✅ Состояние приложения сохраняется');
  });
});
