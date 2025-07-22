# Limni - Native Internet Navigator

---

[English](https://github.com/FerrisMind/Limni/blob/main/README.md) | [Русский](https://github.com/FerrisMind/Limni/blob/main/README-RU.md) | [Português (BR)](https://github.com/FerrisMind/Limni/blob/main/README-PT-BR.md)

---

The project is in active development. It's still far from MVP, but it can already be manually assembled and tested...

---
A modern desktop application for internet exploration built with Tauri v2 and Svelte 5, featuring **native WebViews** instead of iframes.

## ⚡ Key Features

### 🚀 Native WebViews

- **Full-featured native WebViews** instead of iframes for each tab
- **High performance** thanks to system WebView usage
- **Authentic user experience** with isolated contexts for each tab
- **OS-level security** with system WebView sandboxing

### 📑 Multi-tab Navigation

- Open/close tabs with automatic WebView management
- Switch between tabs with show/hide of corresponding WebViews
- Loading indicators for each tab
- Smart memory management when closing tabs

### 🧭 Web Navigation

- Back/Forward buttons with history for each tab
- Address bar with auto-detection of URL/search
- Page reload functionality
- Navigation history for each WebView

### 🔖 Bookmarks and History

- Local bookmark storage
- Complete visit history with date grouping
- History search functionality
- Visit counter

### ⚙️ Settings

- Theme options (light/dark/system)
- WebView security settings
- Homepage management
- Search engine selection

## 🏗️ Architecture

### Backend (Rust + Tauri v2)

```rust
// Commands for WebView management
create_tab_webview()  // Create new WebView for tab
show_tab_webview()    // Show/hide WebView
close_tab_webview()   // Close WebView
navigate_webview()    // Navigate in WebView
resize_webviews()     // Resize WebView
```

### Frontend (Svelte 5)

- **Reactive state management** with runes ($state, $derived, $effect)
- **WebViewManager** - native WebView management
- **Asynchronous architecture** for Tauri API interaction
- **Modern UI** with CSS variables for theming

## 🛠️ Technology Stack

- **Tauri v2** - Cross-platform runtime
- **Svelte 5** - Reactive frontend framework
- **TypeScript** - Typed JavaScript
- **Rust** - Backend programming language
- **Native WebView** - System WebView (WebView2/WebKit/Blink)

## 🚀 Installation and Running

### Requirements

- **Node.js** 18+
- **Rust** 1.70+
- **System dependencies** for Tauri

### Development Mode

```bash
npm install
cargo tauri dev
```

### Production Build

```bash
cargo tauri build
```

## 📁 Project Structure

```
browser/
├── src/                          # Frontend (Svelte)
│   ├── lib/
│   │   ├── components/           # Svelte components
│   │   │   ├── WebViewManager.svelte  # WebView management
│   │   │   ├── TabBar.svelte          # Tab bar
│   │   │   ├── Toolbar.svelte         # Toolbar
│   │   │   └── ...
│   │   ├── stores/              # State management
│   │   │   └── browser.svelte.ts
│   │   └── types/               # TypeScript types
│   │       └── browser.ts
│   └── routes/                  # SvelteKit routes
├── src-tauri/                   # Backend (Rust)
│   ├── src/
│   │   └── lib.rs              # WebView commands and logic
│   ├── capabilities/           # Tauri permissions
│   └── tauri.conf.json        # Configuration
└── package.json
```

## 🎯 Features

### ✅ Implemented

- [x] Native WebViews for each tab
- [x] Multi-tab navigation
- [x] Asynchronous Tauri API interaction
- [x] Bookmark system
- [x] Visit history
- [x] Application settings
- [x] Address bar with search
- [x] Theme support

### 🔄 Future Plans

- [ ] Data synchronization between devices
- [ ] Extensions and plugins
- [ ] Advanced security settings
- [ ] Data import/export
- [ ] Keyboard shortcuts
- [ ] Context menus

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the Limni Attribution License (LAL). See the [`LICENSE`](https://github.com/FerrisMind/Limni/blob/main/LICENSE) file for details.

## 🙏 Acknowledgments

- **Tauri Team** for the amazing framework — [https://tauri.app](https://tauri.app/)
- **Svelte Team** for the reactive frontend framework — [https://svelte.dev](https://svelte.dev/)
- **Rust Community** for the reliable programming language — [https://www.rust-lang.org](https://www.rust-lang.org/)
- **Phosphor Icons** for stylish icons — [https://phosphoricons.com](https://phosphoricons.com/)

---

**Limni** - Showcasing the power of native WebViews in modern desktop applications! 🚀

**Created by [FerrisMind](https://github.com/FerrisMind)**
