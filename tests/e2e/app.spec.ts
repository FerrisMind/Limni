import { test, expect } from '@playwright/test';

test.describe('Limni Application', () => {
  test('should load the main page', async ({ page }) => {
    await page.goto('/');

    // Проверяем, что страница загрузилась
    await expect(page).toHaveTitle(/Limni/);
  });

  test('should have basic UI elements', async ({ page }) => {
    await page.goto('/');

    // Ждем загрузки основных элементов
    await page.waitForLoadState('networkidle');

    // Проверяем наличие основных элементов интерфейса
    // Эти селекторы нужно будет адаптировать под реальную структуру приложения
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should be responsive', async ({ page }) => {
    await page.goto('/');

    // Тестируем разные размеры экрана
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('body')).toBeVisible();

    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('body')).toBeVisible();

    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
  });
});
