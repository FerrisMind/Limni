import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: [
      'build/',
      'dist/',
      '.svelte-kit/',
      '.vercel/',
      'src-tauri/target/',
      'src-tauri/gen/',
      'node_modules/',
      'node_modules/.vite/',
      'playwright-report/',
      'test-results/',
      'coverage/',
      '.nyc_output/',
      'docs/',
      '*.d.ts',
      '!src/**/*.d.ts',
      '*.config.js',
      '*.config.ts',
      'vite.config.ts',
      'vitest.config.ts',
      'svelte.config.js',
      'postcss.config.js',
      'tailwind.config.js',
      'package-lock.json',
      'yarn.lock',
      'pnpm-lock.yaml',
      '.vscode/',
      '.idea/',
      '.DS_Store',
      'Thumbs.db',
      '*.log',
      'npm-debug.log*',
      'yarn-debug.log*',
      'yarn-error.log*',
      '.env',
      '.env.local',
      '.env.*.local',
      '*.md',
      '!README.md'
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...svelte.configs['flat/recommended'],
  prettier,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
  {
    rules: {
      // TypeScript правила
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      
      // Svelte правила
      'svelte/no-at-html-tags': 'error',
      'svelte/no-target-blank': 'error',
      'svelte/no-reactive-functions': 'error',
      'svelte/no-reactive-literals': 'error',
      'svelte/valid-compile': 'off', // Отключаем проверку неиспользуемых CSS селекторов
      
      // Общие правила
      'no-console': 'off', // Разрешаем console.log в разработке
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  {
    // Специальные правила для .d.ts файлов
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // Разрешаем any в файлах типов
    },
  },
];