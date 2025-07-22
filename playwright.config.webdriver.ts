import { defineConfig, devices } from '@playwright/test';

/**
 * Конфигурация Playwright для тестирования Tauri приложения
 * через tauri-driver (WebDriver подход)
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e-webdriver',
  /* Запускаем тесты последовательно для стабильности */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Один воркер для WebDriver */
  workers: 1,
  /* Reporter to use. */
  reporter: 'html',
  /* Увеличенные таймауты для WebDriver */
  timeout: 90000,
  /* Shared settings for all the projects below. */
  use: {
    /* Collect trace when retrying the failed test. */
    trace: 'on-first-retry',

    /* Увеличенные таймауты для WebDriver */
    actionTimeout: 20000,
    navigationTimeout: 60000,
  },

  /* Configure projects for WebDriver */
  projects: [
    {
      name: 'tauri-webdriver',
      use: {
        ...devices['Desktop Chrome'],
        // Подключение к tauri-driver
        connectOptions: {
          wsEndpoint: 'ws://localhost:4444',
        },
      },
    },
  ],

  /* Global setup and teardown для tauri-driver */
  globalSetup: './tests/setup/webdriver-setup.ts',
  globalTeardown: './tests/setup/webdriver-teardown.ts',
});
