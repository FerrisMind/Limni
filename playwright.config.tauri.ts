import { defineConfig, devices } from '@playwright/test';

/**
 * Конфигурация Playwright для тестирования нативного Tauri приложения
 * через WebView2 remote debugging port
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e-tauri',
  /* Запускаем тесты последовательно для стабильности с нативным приложением */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Один воркер для нативного приложения */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Увеличенные таймауты для нативного приложения */
  timeout: 60000,
  /* Shared settings for all the projects below. */
  use: {
    /* Collect trace when retrying the failed test. */
    trace: 'on-first-retry',

    /* Show browser window during tests */
    headless: false,

    /* Увеличенные таймауты для нативного приложения */
    actionTimeout: 15000,
    navigationTimeout: 45000,
  },

  /* Configure projects for Tauri WebView2 */
  projects: [
    {
      name: 'tauri-webview2',
      use: {
        ...devices['Desktop Chrome'],
        // Используем CDP для подключения к WebView2
        connectOptions: {
          wsEndpoint: 'ws://localhost:9222',
        },
      },
    },
  ],

  /* Global setup and teardown для запуска/остановки Tauri приложения */
  globalSetup: './tests/setup/tauri-setup.ts',
  globalTeardown: './tests/setup/tauri-teardown.ts',
});
