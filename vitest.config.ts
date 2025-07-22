import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { sveltePreprocess } from 'svelte-preprocess'; // Используем svelte-preprocess
import path from 'path';

export default defineConfig({
  plugins: [
    svelte({
      hot: !process.env.VITEST,
      compilerOptions: {
        css: 'injected'
      },
      preprocess: sveltePreprocess({
        typescript: true,
        scss: true,
      }),
    })
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/lib/test-setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts}'],
    // Добавляем настройки для исправления Svelte preprocessing
    alias: {
      '$lib': path.resolve('./src/lib'),
      '$app': path.resolve('./node_modules/@sveltejs/kit/src/runtime/app'),
      '~': path.resolve('./src')
    },
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/lib/test-setup.ts',
        '**/*.d.ts',
        '**/*.config.*',
        'src-tauri/**'
      ]
    }
  },
  resolve: {
    alias: {
      '$lib': path.resolve('./src/lib'),
      '$app': path.resolve('./node_modules/@sveltejs/kit/src/runtime/app'),
      '~': path.resolve('./src')
    }
  }
});