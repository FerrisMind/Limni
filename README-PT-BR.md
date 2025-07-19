# Limni - Navegador Nativo de Internet

---------

[English](https://github.com/FerrisMind/Limni/blob/main/README.md) | [Русский](https://github.com/FerrisMind/Limni/blob/main/README-RU.md) | [Português (BR)](https://github.com/FerrisMind/Limni/blob/main/README-PT-BR.md)

---------

Uma aplicação desktop moderna para exploração da internet construída com Tauri v2 e Svelte 5, apresentando **WebViews nativas** ao invés de iframes.

## ⚡ Características Principais

### 🚀 WebViews Nativas
- **WebViews nativas completas** ao invés de iframes para cada aba
- **Alta performance** graças ao uso de WebView do sistema
- **Experiência de usuário autêntica** com contextos isolados para cada aba
- **Segurança ao nível do SO** com sandbox de WebView do sistema

### 📑 Navegação Multi-Aba
- Abrir/fechar abas com gerenciamento automático de WebView
- Alternar entre abas com mostrar/ocultar das WebViews correspondentes
- Indicadores de carregamento para cada aba
- Gerenciamento inteligente de memória ao fechar abas

### 🧭 Navegação Web
- Botões Voltar/Avançar com histórico para cada aba
- Barra de endereços com auto-detecção de URL/busca
- Funcionalidade de recarregar página
- Histórico de navegação para cada WebView

### 🔖 Favoritos e Histórico
- Armazenamento local de favoritos
- Histórico completo de visitas com agrupamento por data
- Funcionalidade de busca no histórico
- Contador de visitas

### ⚙️ Configurações
- Opções de tema (claro/escuro/sistema)
- Configurações de segurança da WebView
- Gerenciamento de página inicial
- Seleção de mecanismo de busca

## 🏗️ Arquitetura

### Backend (Rust + Tauri v2)
```rust
// Comandos para gerenciamento de WebView
create_tab_webview()  // Criar nova WebView para aba
show_tab_webview()    // Mostrar/ocultar WebView
close_tab_webview()   // Fechar WebView
navigate_webview()    // Navegar na WebView
resize_webviews()     // Redimensionar WebView
```

### Frontend (Svelte 5)
- **Gerenciamento de estado reativo** com runes ($state, $derived, $effect)
- **WebViewManager** - gerenciamento de WebViews nativas
- **Arquitetura assíncrona** para interação com API Tauri
- **UI moderna** com variáveis CSS para temas

## 🛠️ Stack Tecnológico

- **Tauri v2** - Runtime multiplataforma
- **Svelte 5** - Framework frontend reativo
- **TypeScript** - JavaScript tipado
- **Rust** - Linguagem de programação backend
- **Native WebView** - WebView do sistema (WebView2/WebKit/Blink)

## 🚀 Instalação e Execução

### Requisitos
- **Node.js** 18+
- **Rust** 1.70+
- **Dependências do sistema** para Tauri

### Modo de Desenvolvimento
```bash
npm install
npm run tauri dev
```

### Build de Produção
```bash
npm run tauri build
```

## 📁 Estrutura do Projeto

```
browser/
├── src/                          # Frontend (Svelte)
│   ├── lib/
│   │   ├── components/           # Componentes Svelte
│   │   │   ├── WebViewManager.svelte  # Gerenciamento de WebView
│   │   │   ├── TabBar.svelte          # Barra de abas
│   │   │   ├── Toolbar.svelte         # Barra de ferramentas
│   │   │   └── ...
│   │   ├── stores/              # Gerenciamento de estado
│   │   │   └── browser.svelte.ts
│   │   └── types/               # Tipos TypeScript
│   │       └── browser.ts
│   └── routes/                  # Rotas SvelteKit
├── src-tauri/                   # Backend (Rust)
│   ├── src/
│   │   └── lib.rs              # Comandos e lógica WebView
│   ├── capabilities/           # Permissões Tauri
│   └── tauri.conf.json        # Configuração
└── package.json
```

## 🎯 Funcionalidades

### ✅ Implementado
- [x] WebViews nativas para cada aba
- [x] Navegação multi-aba
- [x] Interação assíncrona com API Tauri
- [x] Sistema de favoritos
- [x] Histórico de visitas
- [x] Configurações da aplicação
- [x] Barra de endereços com busca
- [x] Suporte a temas

### 🔄 Planos Futuros
- [ ] Sincronização de dados entre dispositivos
- [ ] Extensões e plugins
- [ ] Configurações avançadas de segurança
- [ ] Importação/exportação de dados
- [ ] Atalhos de teclado
- [ ] Menus de contexto

## 🤝 Contribuindo

1. Faça fork do repositório
2. Crie uma branch para feature (`git checkout -b feature/amazing-feature`)
3. Commit suas mudanças (`git commit -m 'Add amazing feature'`)
4. Push para a branch (`git push origin feature/amazing-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Limni Attribution License (LAL). Veja o arquivo [`LICENSE`](https://github.com/FerrisMind/Limni/blob/main/LICENSE) para detalhes.

## 🙏 Agradecimentos

- **Time Tauri** pelo framework incrível — [https://tauri.app](https://tauri.app/)
- **Time Svelte** pelo framework frontend reativo — [https://svelte.dev](https://svelte.dev/)
- **Comunidade Rust** pela linguagem de programação confiável — [https://www.rust-lang.org](https://www.rust-lang.org/)

---

**Limni** - Demonstrando o poder das WebViews nativas em aplicações desktop modernas! 🚀

**Criado por [FerrisMind](https://github.com/FerrisMind)** 