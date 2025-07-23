use tauri::{Manager, LogicalPosition, LogicalSize, AppHandle, WebviewUrl, Position, Size, Emitter};
use tauri::webview::WebviewBuilder;
use crate::state::{WebviewState, HEADER_HEIGHT};
use crate::utils::{fetch_favicon_backend, fetch_page_title_backend, get_title_from_url};

/// Создает новый CHILD webview для вкладки (embedded, ниже UI)
pub async fn create_tab_webview_impl(
    app: AppHandle,
    tab_id: String,
    url: String,
    _title: String,
) -> Result<String, String> {
    let webview_label = format!("tab-{}", tab_id);
    
    // Получаем главное окно
    let main_window = app.get_window("main")
        .ok_or("Main window not found")?;
    
    // Получаем размеры окна
    let window_size = main_window.inner_size()
        .map_err(|e| format!("Failed to get window size: {}", e))?;
    
    // Создаем webview URL
    let webview_url = if url.starts_with("http://") || url.starts_with("https://") {
        WebviewUrl::External(url.parse().map_err(|e| format!("Invalid URL: {}", e))?)
    } else {
        WebviewUrl::App("index.html".into())
    };
    
    // КЛЮЧЕВОЕ ОТЛИЧИЕ: создаем CHILD WebView, который будет ниже UI
    let webview_builder = WebviewBuilder::new(webview_label.clone(), webview_url)
        .auto_resize() // Автоматически изменяет размер при изменении окна
        .transparent(false) // Убираем прозрачность
        .focused(false) // Child WebView не должен получать фокус автоматически
        .on_navigation({
            let app_handle = app.clone();
            let tab_id_clone = tab_id.clone();
            move |url| {
                let url_string = url.to_string();
                
                // Отправляем событие об изменении URL во frontend
                let _ = app_handle.emit("webview-url-changed", serde_json::json!({
                    "tabId": tab_id_clone,
                    "url": url_string.clone()
                }));
                
                // Определяем title на основе URL для быстрого обновления
                let url_based_title = get_title_from_url(&url_string);
                
                // Отправляем предварительное событие обновления title (пока страница не загрузилась)
                let _ = app_handle.emit("webview-title-changed", serde_json::json!({
                    "tabId": tab_id_clone,
                    "title": url_based_title
                }));
                
                println!("🦀 Rust: Navigation title update: '{}' for tab: {}", url_based_title, tab_id_clone);
                
                true // Разрешаем навигацию
            }
        })
        .on_page_load({
            let app_handle = app.clone();
            let tab_id_clone = tab_id.clone();
            move |webview, _payload| {
                println!("🦀 Rust: on_page_load triggered for tab: {}", tab_id_clone);
                let app_clone = app_handle.clone();
                let tab_id_clone_inner = tab_id_clone.clone();
                
                // Получаем title и favicon после загрузки страницы
                tauri::async_runtime::spawn(async move {
                    handle_page_load(app_clone, tab_id_clone_inner, webview).await;
                });
            }
        })
        .initialization_script(get_webview_initialization_script());
    
    // Позиционируем под header панелями
    let position = Position::Logical(LogicalPosition::new(0.0, HEADER_HEIGHT));
    let size = Size::Logical(LogicalSize::new(
        window_size.width as f64, 
        window_size.height as f64 - HEADER_HEIGHT
    ));
    
    // КРИТИЧЕСКИ ВАЖНО: используем add_child для создания embedded WebView
    // Child WebView автоматически ниже UI родительского окна
    let webview = main_window.add_child(webview_builder, position, size)
        .map_err(|e| format!("Failed to create child webview: {}", e))?;
    
    // Скрываем webview по умолчанию (но он останется ниже UI)
    webview.hide().map_err(|e| format!("Failed to hide webview: {}", e))?;
    
    // Сохраняем ссылку на webview
    let state = app.state::<WebviewState>();
    let mut webviews = state.webviews.lock().unwrap();
    webviews.insert(tab_id.clone(), webview_label.clone());
    
    Ok(webview_label)
}

/// Показывает webview вкладки
pub async fn show_tab_webview_impl(
    app: AppHandle,
    tab_id: String,
) -> Result<(), String> {
    let state = app.state::<WebviewState>();
    let webviews = state.webviews.lock().unwrap();
    
    // Скрываем только ДРУГИЕ webview'ы (не активный)
    for (other_tab_id, webview_label) in webviews.iter() {
        if other_tab_id != &tab_id {
            if let Some(webview) = app.get_webview(webview_label) {
                let _ = webview.hide(); // Скрываем неактивные WebView
            }
        }
    }
    
    // Показываем нужный webview если он существует
    if let Some(webview_label) = webviews.get(&tab_id) {
        if let Some(webview) = app.get_webview(webview_label) {
            webview.show().map_err(|e| format!("Failed to show webview: {}", e))?;
            
            // Убеждаемся, что webview находится на правильном месте
            let main_window = app.get_window("main")
                .ok_or("Main window not found")?;
            let window_size = main_window.inner_size()
                .map_err(|e| format!("Failed to get window size: {}", e))?;
            
            let position = Position::Logical(LogicalPosition::new(0.0, HEADER_HEIGHT));
            let size = Size::Logical(LogicalSize::new(
                window_size.width as f64, 
                window_size.height as f64 - HEADER_HEIGHT
            ));
            
            let _ = webview.set_position(position);
            let _ = webview.set_size(size);
        } else {
            return Err("Webview not found".to_string());
        }
    }
    // Если webview для вкладки не найден (например, about:blank), просто скрываем все
    
    Ok(())
}

/// Скрывает все webview'ы (для about:blank вкладок)
pub async fn hide_all_webviews_impl(app: AppHandle) -> Result<(), String> {
    let state = app.state::<WebviewState>();
    let webviews = state.webviews.lock().unwrap();
    
    // Скрываем все webview'ы
    for webview_label in webviews.values() {
        if let Some(webview) = app.get_webview(webview_label) {
            let _ = webview.hide(); // Игнорируем ошибки при скрытии
        }
    }
    
    Ok(())
}

/// Закрывает webview вкладки
pub async fn close_tab_webview_impl(
    app: AppHandle,
    tab_id: String,
) -> Result<(), String> {
    let state = app.state::<WebviewState>();
    let mut webviews = state.webviews.lock().unwrap();
    
    if let Some(webview_label) = webviews.remove(&tab_id) {
        if let Some(webview) = app.get_webview(&webview_label) {
            webview.close().map_err(|e| format!("Failed to close webview: {}", e))?;
        }
    }
    
    Ok(())
}

/// Навигация в webview
pub async fn navigate_webview_impl(
    app: AppHandle,
    tab_id: String,
    url: String,
) -> Result<(), String> {
    let state = app.state::<WebviewState>();
    let webviews = state.webviews.lock().unwrap();
    
    if let Some(webview_label) = webviews.get(&tab_id) {
        if let Some(webview) = app.get_webview(webview_label) {
            // Навигация в существующем webview
            let webview_url = if url.starts_with("http://") || url.starts_with("https://") || url.starts_with("file://") {
                url.parse().map_err(|e| format!("Invalid URL: {}", e))?
            } else {
                return Err(format!("Unsupported URL scheme for navigation: {}", url));
            };
            
            webview.navigate(webview_url)
                .map_err(|e| format!("Failed to navigate webview: {}", e))?;
            
            println!("🦀 Rust: Navigated existing webview for tab {} to {}", tab_id, url);
            Ok(())
        } else {
            Err("Webview not found".to_string())
        }
    } else {
        Err("Tab not found".to_string())
    }
}

/// Обрабатывает загрузку страницы
async fn handle_page_load(app_clone: AppHandle, tab_id_clone_inner: String, webview: tauri::Webview) {
    // Небольшая задержка для полной загрузки DOM
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    
    // Получаем URL для favicon
    if let Ok(current_url) = webview.url() {
        let url_str = current_url.to_string();
        
        // Надежное получение title через оценку JavaScript
        let title_script = get_title_detection_script();
        
        println!("🦀 Rust: Injecting title script for tab: {}", tab_id_clone_inner);
        let _ = webview.eval(&title_script);
        
        // Детекция медиаконтента
        let media_detection_script = get_media_detection_script();
        
        if let Ok(_) = webview.eval(media_detection_script) {
            // Поскольку eval возвращает Result сразу, обрабатываем его синхронно
            println!("🦀 Rust: Media detection executed for tab: {}", tab_id_clone_inner);
            
            // Отправляем событие об изменении медиаконтента (по умолчанию true для YouTube)
            let has_audio = url_str.contains("youtube.com") || url_str.contains("vimeo.com") || url_str.contains("soundcloud.com");
            let _ = app_clone.emit("webview-audio-changed", serde_json::json!({
                "tabId": tab_id_clone_inner,
                "hasAudio": has_audio,
                "isAudioMuted": false
            }));
        }
        
        // Устанавливаем периодическую проверку медиаконтента
        setup_periodic_media_check(app_clone.clone(), tab_id_clone_inner.clone(), webview.clone()).await;
        
        // Добавляем задержку для загрузки DOM и затем извлекаем title
        setup_title_extraction(app_clone.clone(), tab_id_clone_inner.clone(), webview.clone()).await;
        
        // Получаем favicon асинхронно
        if url_str != "about:blank" && url_str.starts_with("http") {
            let app_clone_favicon = app_clone.clone();
            let tab_id_favicon = tab_id_clone_inner.clone();
            let url_for_favicon = url_str.clone();
            tauri::async_runtime::spawn(async move {
                match fetch_favicon_backend(url_for_favicon).await {
                    Ok(favicon_data) => {
                        let _ = app_clone_favicon.emit("webview-favicon-changed", serde_json::json!({
                            "tabId": tab_id_favicon,
                            "favicon": favicon_data
                        }));
                    },
                    Err(err) => {
                        // Если не удалось получить favicon, отправляем null
                        let _ = app_clone_favicon.emit("webview-favicon-changed", serde_json::json!({
                            "tabId": tab_id_favicon,
                            "favicon": null
                        }));
                        
                        // Проверяем, является ли это критической ошибкой загрузки
                        if err.to_string().contains("connection") || err.to_string().contains("timeout") {
                            let error_message = format!("Ошибка загрузки страницы: {}", err);
                            let _ = app_clone_favicon.emit("webview-load-error", serde_json::json!({
                                "tabId": tab_id_favicon,
                                "errorMessage": error_message
                            }));
                        }
                    }
                }
            });
        }

        // Асинхронно получаем реальный заголовок страницы и обновляем вкладку
        if url_str != "about:blank" && url_str.starts_with("http") {
            let app_clone_title_real = app_clone.clone();
            let tab_id_title_real = tab_id_clone_inner.clone();
            let url_for_title = url_str.clone();
            tauri::async_runtime::spawn(async move {
                match fetch_page_title_backend(url_for_title).await {
                    Ok(real_title) => {
                        let _ = app_clone_title_real.emit("webview-title-changed", serde_json::json!({
                            "tabId": tab_id_title_real,
                            "title": real_title
                        }));
                        println!("🦀 Rust: Real title set to '{}' for tab: {}", real_title, tab_id_title_real);
                    },
                    Err(err) => {
                        println!("🦀 Rust: Failed to fetch page title: {}", err);
                    }
                }
            });
        }
    }
}

/// Устанавливает периодическую проверку медиаконтента
async fn setup_periodic_media_check(_app_clone: AppHandle, _tab_id: String, webview: tauri::Webview) {
    tauri::async_runtime::spawn(async move {
        let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(3));
        let mut check_count = 0;
        const MAX_CHECKS: u32 = 100; // Ограничиваем количество проверок
        
        loop {
            // Проверяем, не превышен ли лимит проверок
            if check_count >= MAX_CHECKS {
                println!("🦀 Rust: Media check limit reached, stopping periodic check");
                break;
            }
            
            interval.tick().await;
            check_count += 1;
            
            let periodic_script = r#"
                (function() {
                    let hasAudio = false;
                    
                    // Проверяем audio элементы
                    document.querySelectorAll('audio').forEach(audio => {
                        if (!audio.paused && audio.currentTime > 0) {
                            hasAudio = true;
                        }
                    });
                    
                    // Проверяем video элементы
                    document.querySelectorAll('video').forEach(video => {
                        if (!video.paused && video.currentTime > 0) {
                            hasAudio = true;
                        }
                    });
                    
                    // Специальная проверка для YouTube
                    if (window.location.hostname.includes('youtube.com')) {
                        const player = document.querySelector('video');
                        if (player && !player.paused && player.currentTime > 0) {
                            hasAudio = true;
                        }
                    }
                    
                    return hasAudio;
                })()
            "#;
            
            // Проверяем, что webview еще доступен
            if webview.eval(periodic_script).is_err() {
                println!("🦀 Rust: WebView no longer accessible, stopping media check");
                break;
            }
            
            tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
        }
    });
}

/// Устанавливает извлечение title после загрузки
async fn setup_title_extraction(app_clone: AppHandle, tab_id: String, webview: tauri::Webview) {
    tauri::async_runtime::spawn(async move {
        // Ждем загрузки DOM
        tokio::time::sleep(tokio::time::Duration::from_millis(1000)).await;
        
        // Извлекаем title после загрузки
        let extract_title_script = r#"
            (function() {
                const title = document.title || document.querySelector('title')?.textContent || 'Новая вкладка';
                console.log('🌐 WebView: Title extraction after load:', title);
                return title;
            })()
        "#;
        
        if let Ok(_) = webview.eval(extract_title_script) {
            // Получаем URL страницы для определения title
            if let Ok(current_url) = webview.url() {
                let url_str = current_url.to_string();
                let fallback_title = get_title_from_url(&url_str);
                
                // Отправляем событие обновления title
                let _ = app_clone.emit("webview-title-changed", serde_json::json!({
                    "tabId": tab_id,
                    "title": fallback_title
                }));
                
                println!("🦀 Rust: Fallback title set to '{}' for tab: {}", fallback_title, tab_id);
            }
        }
    });
}

/// Возвращает скрипт инициализации для webview
fn get_webview_initialization_script() -> &'static str {
    r#"
        // Child WebView инициализация
        // Функция для безопасного вызова Tauri API
        function safeTauriInvoke(command, args) {
            return new Promise(function(resolve, reject) {
                // Проверяем доступность Tauri API
                if (typeof window.__TAURI__ !== 'undefined' && 
                    window.__TAURI__.core && 
                    typeof window.__TAURI__.core.invoke === 'function') {
                    window.__TAURI__.core.invoke(command, args)
                        .then(resolve)
                        .catch(reject);
                } else {
                    // Если Tauri API недоступен, отклоняем промис
                    reject(new Error('Tauri API not available'));
                }
            });
        }
        
        // Функция инициализации обработчиков кликов
        function initLinkHandlers() {
            // Перехватываем клики по ссылкам для обхода opener plugin
            document.addEventListener('click', function(event) {
                // Находим ближайшую ссылку
                let target = event.target;
                while (target && target.tagName !== 'A') {
                    target = target.parentElement;
                }
                
                if (target && target.href && target.href.startsWith('http')) {
                    // Проверяем, что это внешняя ссылка
                    if (target.hostname !== window.location.hostname) {
                        event.preventDefault();
                        
                        // Используем нашу команду вместо opener plugin
                        safeTauriInvoke('open_url_in_new_tab', {
                            url: target.href
                        }).catch(function(error) {
                            console.error('Failed to open URL in new tab:', error);
                            // Fallback - открываем в той же вкладке
                            window.location.href = target.href;
                        });
                    }
                }
            }, true);
        }
        
        document.addEventListener('DOMContentLoaded', function() {
            document.body.style.margin = '0';
            document.body.style.padding = '0';
            // Child WebView автоматически ниже UI родителя
            
            // Инициализируем обработчики кликов
            initLinkHandlers();
            
            // Дополнительная инициализация после небольшой задержки
            setTimeout(function() {
                if (typeof window.__TAURI__ === 'undefined') {
                    console.log('Tauri API still not available, using fallback navigation');
                }
            }, 100);
        });
    "#
}

/// Возвращает скрипт для детекции title
fn get_title_detection_script() -> String {
    r#"
        (function() {
            console.log('🌐 WebView: Executing title detection script');
            
            const title = document.title || document.querySelector('title')?.textContent || 'Новая вкладка';
            console.log('🌐 WebView: Found title:', title);
            
            // Сохраняем последний title для отслеживания изменений
            window._lastDetectedTitle = title;
            
            // Устанавливаем наблюдатель за изменениями title
            if (!window._titleObserverSet) {
                // MutationObserver для отслеживания изменений в title
                const titleObserver = new MutationObserver(() => {
                    const newTitle = document.title || document.querySelector('title')?.textContent || 'Новая вкладка';
                    if (newTitle !== window._lastDetectedTitle) {
                        console.log('🌐 WebView: Title changed to:', newTitle);
                        window._lastDetectedTitle = newTitle;
                        window._pendingTitleUpdate = newTitle;
                    }
                });
                
                titleObserver.observe(document.querySelector('head') || document.documentElement, {
                    subtree: true,
                    childList: true
                });
                
                // Также отслеживаем прямые изменения document.title
                let originalTitleSetter = Object.getOwnPropertyDescriptor(Document.prototype, 'title')?.set;
                if (originalTitleSetter) {
                    Object.defineProperty(document, 'title', {
                        set: function(value) {
                            originalTitleSetter.call(this, value);
                            console.log('🌐 WebView: Title set via property to:', value);
                            window._lastDetectedTitle = value;
                            window._pendingTitleUpdate = value;
                        },
                        get: function() {
                            return this.querySelector('title')?.textContent || '';
                        }
                    });
                }
                
                window._titleObserverSet = true;
            }
            
            // Возвращаем title для немедленной обработки
            return title;
        })();
    "#.to_string()
}

/// Возвращает скрипт для детекции медиаконтента
fn get_media_detection_script() -> &'static str {
    r#"
        (function() {
            let hasAudio = false;
            
            // Проверяем audio элементы
            document.querySelectorAll('audio').forEach(audio => {
                if (!audio.paused || audio.readyState > 0) {
                    hasAudio = true;
                }
            });
            
            // Проверяем video элементы
            document.querySelectorAll('video').forEach(video => {
                if (!video.paused || video.readyState > 0) {
                    hasAudio = true;
                }
            });
            
            // Проверяем iframe (YouTube, Vimeo и т.д.)
            if (document.querySelectorAll('iframe[src*="youtube.com"], iframe[src*="vimeo.com"], iframe[src*="soundcloud.com"]').length > 0) {
                hasAudio = true;
            }
            
            // Проверяем Web Audio API
            if (window.AudioContext || window.webkitAudioContext) {
                hasAudio = true;
            }
            
            return hasAudio;
        })()
    "#
}