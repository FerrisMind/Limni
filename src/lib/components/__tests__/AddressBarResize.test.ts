import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('AddressBar Auto-resize', () => {
  it('должен иметь правильные CSS свойства для автоматического изменения размеров', () => {
    const addressBarPath = join(__dirname, '../AddressBar.svelte');
    const addressBarContent = readFileSync(addressBarPath, 'utf-8');

    // Проверяем, что адресная строка имеет flex: 1 и width: 100%
    expect(addressBarContent).toContain('flex: 1');
    expect(addressBarContent).toContain('width: 100%');
    expect(addressBarContent).toContain('margin: var(--spacing-xs) 0');

    // Проверяем, что убрали max-width ограничение
    expect(addressBarContent).not.toContain('max-width: 600px');
  });

  it('должен иметь правильную структуру тулбара для автоматического изменения размеров', () => {
    const toolbarPath = join(__dirname, '../Toolbar.svelte');
    const toolbarContent = readFileSync(toolbarPath, 'utf-8');

    // Проверяем, что center-section имеет flex: 1
    expect(toolbarContent).toContain('.center-section');
    expect(toolbarContent).toMatch(/\.center-section[\s\S]*?flex:\s*1/);

    // Проверяем, что добавлены отступы
    expect(toolbarContent).toMatch(/\.center-section[\s\S]*?margin:\s*0\s+var\(--spacing-md\)/);

    // Проверяем, что justify-content изменён на stretch
    expect(toolbarContent).toMatch(/\.center-section[\s\S]*?justify-content:\s*stretch/);
  });

  it('зона прокрутки табов должна иметь правильный отступ справа для WindowControls', () => {
    const tabBarPath = join(__dirname, '../TabBar.svelte');
    const tabBarContent = readFileSync(tabBarPath, 'utf-8');

    // Проверяем, что .tabs-scrollable использует CSS переменную для резерва места под WindowControls
    expect(tabBarContent).toMatch(
      /\.tabs-scrollable[\s\S]*?margin-right:\s*var\(--window-controls-width\)/
    );

    // Проверяем комментарий объясняющий назначение отступа
    expect(tabBarContent).toContain('Резервируем место под WindowControls справа');
  });

  it('должен иметь адаптивные отступы для разных размеров экрана', () => {
    const toolbarPath = join(__dirname, '../Toolbar.svelte');
    const toolbarContent = readFileSync(toolbarPath, 'utf-8');

    // Проверяем адаптивные стили для планшетов
    expect(toolbarContent).toMatch(
      /@media\s*\(max-width:\s*768px\)[\s\S]*?\.center-section[\s\S]*?margin:\s*0\s+var\(--spacing-sm\)/
    );

    // Проверяем адаптивные стили для мобильных
    expect(toolbarContent).toMatch(
      /@media\s*\(max-width:\s*480px\)[\s\S]*?\.center-section[\s\S]*?margin:\s*0\s+var\(--spacing-xs\)/
    );
  });

  it('должен убрать gap из основного тулбара', () => {
    const toolbarPath = join(__dirname, '../Toolbar.svelte');
    const toolbarContent = readFileSync(toolbarPath, 'utf-8');

    // Проверяем, что gap убран из .toolbar
    const toolbarStyleMatch = toolbarContent.match(/\.toolbar\s*\{[^}]*\}/s);
    expect(toolbarStyleMatch).toBeTruthy();

    if (toolbarStyleMatch) {
      const toolbarStyle = toolbarStyleMatch[0];
      expect(toolbarStyle).not.toContain('gap: var(--spacing-md)');
    }
  });
});
