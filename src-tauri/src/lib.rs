use tauri::{Manager, LogicalPosition, LogicalSize, AppHandle, WebviewUrl, Position, Size, Emitter};
use tauri::webview::WebviewBuilder;
use std::collections::HashMap;
use std::sync::Mutex;
use reqwest::Client;
use base64::{engine::general_purpose, Engine as _};

// Состояние для отслеживания webview'ов
#[derive(Default)]
struct WebviewState {
    webviews: Mutex<HashMap<String, String>>, // tab_id -> webview_label
}

// Константа для правильной высоты header'а
// TabBar + WindowControls (44px) + Toolbar (44px) = 88.0px
const HEADER_HEIGHT: f64 = 89.0;

// Команда для получения текущего URL webview
#[tauri::command]
async fn get_webview_url(
    app: AppHandle,
    tab_id: String,
) -> Result<String, String> {
    let state = app.state::<WebviewState>();
    let webviews = state.webviews.lock().unwrap();
    
    if let Some(webview_label) = webviews.get(&tab_id) {
        if let Some(webview) = app.get_webview(webview_label) {
            match webview.url() {
                Ok(url) => Ok(url.to_string()),
                Err(e) => Err(format!("Failed to get webview URL: {}", e))
            }
        } else {
            Err("Webview not found".to_string())
        }
    } else {
        Err("Tab not found".to_string())
    }
}

// Команда для обновления title вкладки из JavaScript injection
#[tauri::command]
async fn update_webview_title(
    app: AppHandle,
    tab_id: String,
    title: String,
) -> Result<(), String> {
    println!("🦀 Rust: Received title update: '{}' for tab: {}", title, tab_id);
    
    // Отправляем событие об изменении title во frontend
    app.emit("webview-title-changed", serde_json::json!({
        "tabId": tab_id,
        "title": title
    })).map_err(|e| format!("Failed to emit title change event: {}", e))?;
    
    println!("🦀 Rust: Title event emitted successfully");
    Ok(())
}

// Команда для создания нового CHILD webview для вкладки (embedded, ниже UI)
#[tauri::command]
async fn create_tab_webview(
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
                let url_based_title = if url_string.contains("yandex.ru") {
                    "Яндекс".to_string()
                } else if url_string.contains("google.com") {
                    "Google".to_string()
                } else if url_string.contains("youtube.com") {
                    "YouTube".to_string()
                } else if url_string.contains("github.com") {
                    "GitHub".to_string()
                } else if url_string == "about:blank" {
                    "Новая вкладка".to_string()
                } else {
                    // Извлекаем домен из URL
                    if let Ok(parsed_url) = url::Url::parse(&url_string) {
                        parsed_url.host_str().unwrap_or("Новая вкладка").to_string()
                    } else {
                        "Новая вкладка".to_string()
                    }
                };
                
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
                    // Небольшая задержка для полной загрузки DOM
                    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
                    
                    // Получаем URL для favicon
                    if let Ok(current_url) = webview.url() {
                        let url_str = current_url.to_string();
                        
                        // Надежное получение title через оценку JavaScript
                        let title_script = format!(r#"
                            (function() {{
                                console.log('🌐 WebView: Executing title detection script');
                                
                                const title = document.title || document.querySelector('title')?.textContent || 'Новая вкладка';
                                console.log('🌐 WebView: Found title:', title);
                                
                                // Сохраняем последний title для отслеживания изменений
                                window._lastDetectedTitle = title;
                                
                                // Устанавливаем наблюдатель за изменениями title
                                if (!window._titleObserverSet) {{
                                    // MutationObserver для отслеживания изменений в title
                                    const titleObserver = new MutationObserver(() => {{
                                        const newTitle = document.title || document.querySelector('title')?.textContent || 'Новая вкладка';
                                        if (newTitle !== window._lastDetectedTitle) {{
                                            console.log('🌐 WebView: Title changed to:', newTitle);
                                            window._lastDetectedTitle = newTitle;
                                            window._pendingTitleUpdate = newTitle;
                                        }}
                                    }});
                                    
                                    titleObserver.observe(document.querySelector('head') || document.documentElement, {{
                                        subtree: true,
                                        childList: true
                                    }});
                                    
                                    // Также отслеживаем прямые изменения document.title
                                    let originalTitleSetter = Object.getOwnPropertyDescriptor(Document.prototype, 'title')?.set;
                                    if (originalTitleSetter) {{
                                        Object.defineProperty(document, 'title', {{
                                            set: function(value) {{
                                                originalTitleSetter.call(this, value);
                                                console.log('🌐 WebView: Title set via property to:', value);
                                                window._lastDetectedTitle = value;
                                                window._pendingTitleUpdate = value;
                                            }},
                                            get: function() {{
                                                return this.querySelector('title')?.textContent || '';
                                            }}
                                        }});
                                    }}
                                    
                                    window._titleObserverSet = true;
                                }}
                                
                                // Возвращаем title для немедленной обработки
                                return title;
                            }})();
                        "#);
                        
                        println!("🦀 Rust: Injecting title script for tab: {}", tab_id_clone_inner);
                        let _ = webview.eval(&title_script);
                        
                        // Добавляем задержку для загрузки DOM и затем извлекаем title
                        let webview_clone = webview.clone();
                        let app_clone_title = app_clone.clone();
                        let tab_id_title = tab_id_clone_inner.clone();
                        
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
                            
                            if let Ok(_) = webview_clone.eval(extract_title_script) {
                                // Получаем URL страницы для определения title
                                if let Ok(current_url) = webview_clone.url() {
                                    let url_str = current_url.to_string();
                                    
                                    // Определяем title на основе URL (как fallback)
                                    let fallback_title = if url_str.contains("yandex.ru") {
                                        "Яндекс".to_string()
                                    } else if url_str.contains("google.com") {
                                        "Google".to_string()
                                    } else if url_str.contains("youtube.com") {
                                        "YouTube".to_string()
                                    } else if url_str.contains("github.com") {
                                        "GitHub".to_string()
                                    } else if url_str == "about:blank" {
                                        "Новая вкладка".to_string()
                                    } else {
                                        // Пытаемся извлечь домен из URL
                                        if let Ok(parsed_url) = url::Url::parse(&url_str) {
                                            parsed_url.host_str().unwrap_or("Новая вкладка").to_string()
                                        } else {
                                            "Новая вкладка".to_string()
                                        }
                                    };
                                    
                                    // Отправляем событие обновления title
                                    let _ = app_clone_title.emit("webview-title-changed", serde_json::json!({
                                        "tabId": tab_id_title,
                                        "title": fallback_title
                                    }));
                                    
                                    println!("🦀 Rust: Fallback title set to '{}' for tab: {}", fallback_title, tab_id_title);
                                }
                            }
                        });
                        
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
                                    Err(_err) => {
                                        // Если не удалось получить favicon, отправляем null
                                        let _ = app_clone_favicon.emit("webview-favicon-changed", serde_json::json!({
                                            "tabId": tab_id_favicon,
                                            "favicon": null
                                        }));
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
                });
            }
        })
        .initialization_script(r#"
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
        "#);
    
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

// Команда для показа webview вкладки
#[tauri::command]
async fn show_tab_webview(
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

// Команда для скрытия всех webview'ов (для about:blank вкладок)
#[tauri::command]
async fn hide_all_webviews(app: AppHandle) -> Result<(), String> {
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

// Команда для закрытия webview вкладки
#[tauri::command]
async fn close_tab_webview(
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

// Команда для навигации в webview
#[tauri::command]
async fn navigate_webview(
    app: AppHandle,
    tab_id: String,
    url: String,
) -> Result<(), String> {
    let state = app.state::<WebviewState>();
    let webviews = state.webviews.lock().unwrap();
    
    if let Some(webview_label) = webviews.get(&tab_id) {
        if let Some(webview) = app.get_webview(webview_label) {
            // Для навигации в webview используем eval с window.location
            let script = format!(r#"window.location.href = "{}";"#, url);
            webview.eval(&script).map_err(|e| format!("Failed to navigate: {}", e))?;
        } else {
            return Err("Webview not found".to_string());
        }
    } else {
        return Err("Tab not found".to_string());
    }
    
    Ok(())
}

// Команда для открытия URL в новой вкладке (альтернатива opener plugin)
#[tauri::command]
async fn open_url_in_new_tab(
    app: AppHandle,
    url: String,
) -> Result<String, String> {
    use std::time::SystemTime;
    
    // Генерируем ID для новой вкладки
    let timestamp = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    let tab_id = format!("tab_{}", timestamp);
    
    // Создаем новый webview для этого URL
    let webview_label = create_tab_webview(app.clone(), tab_id.clone(), url.clone(), "Загрузка...".to_string()).await?;
    
    // Отправляем событие о создании новой вкладки во frontend
    app.emit("new-tab-created", serde_json::json!({
        "tabId": tab_id,
        "url": url,
        "title": "Загрузка...",
        "webviewLabel": webview_label
    })).map_err(|e| format!("Failed to emit new tab event: {}", e))?;
    
    Ok(tab_id)
}

// Команда для получения информации о webview'ах (для отладки)
#[tauri::command]
async fn get_webview_info(app: AppHandle) -> Result<Vec<String>, String> {
    let state = app.state::<WebviewState>();
    let webviews = state.webviews.lock().unwrap();
    
    let mut info = Vec::new();
    for (tab_id, webview_label) in webviews.iter() {
        let exists = app.get_webview(webview_label).is_some();
        info.push(format!("Tab: {}, Label: {}, Exists: {}", tab_id, webview_label, exists));
    }
    
    Ok(info)
}

// Команда для получения фавиконки через бэкенд
#[tauri::command]
async fn fetch_favicon_backend(url: String) -> Result<String, String> {
    let client = Client::new();
    
    // Пытаемся получить фавиконку по указанному URL
    // Favicon URL обычно это host + /favicon.ico
    let _parsed_url = url::Url::parse(&url).map_err(|e| format!("Invalid URL: {}", e))?;
    let _base_url = format!("{}://{}/", _parsed_url.scheme(), _parsed_url.host_str().unwrap_or(""));
    let favicon_url_candidate = _parsed_url.join("/favicon.ico").map_err(|e| format!("Failed to build favicon URL: {}", e))?;

    // Попробуем сначала favicon.ico
    let response = client.get(favicon_url_candidate.as_str()).send().await;

    let final_response = match response {
        Ok(res) if res.status().is_success() => {
            // Если получили 200 OK, используем этот ответ
            Some(res)
        },
        _ => {
            // Если favicon.ico не найден или ошибка, попробуем получить через DuckDuckGo Favicon API
            let duckduckgo_favicon_api_url = format!("https://icons.duckduckgo.com/ip3/{}.ico", _parsed_url.host_str().unwrap_or(""));
            let ddg_response = client.get(&duckduckgo_favicon_api_url).send().await;
            
            match ddg_response {
                Ok(res) if res.status().is_success() => Some(res),
                _ => None, // Не удалось получить фавиконку ни одним способом
            }
        }
    };

    if let Some(res) = final_response {
        let content_type = res.headers()
            .get(reqwest::header::CONTENT_TYPE)
            .and_then(|value| value.to_str().ok())
            .unwrap_or("image/x-icon")
            .split(';')
            .next()
            .unwrap_or("image/x-icon")
            .to_string();

        let bytes = res.bytes().await.map_err(|e| format!("Failed to read favicon bytes: {}", e))?;
        let encoded_favicon = general_purpose::STANDARD.encode(&bytes);
        Ok(format!("data:{};base64,{}", content_type, encoded_favicon))
    } else {
        Err("Failed to fetch favicon.".to_string())
    }
}

// Utility: Fetch real <title> of a page for more accurate tab titles
async fn fetch_page_title_backend(url: String) -> Result<String, String> {
    // Only handle http/https URLs for now
    if !url.starts_with("http") {
        return Err("Unsupported URL scheme".to_string());
    }

    let client = Client::new();
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Request error: {}", e))?;

    let body = response
        .text()
        .await
        .map_err(|e| format!("Body read error: {}", e))?;

    // Extract <title> tag contents using a simple regex
    use regex::Regex;
    let re = Regex::new(r"(?is)<title[^>]*>(.*?)</title>")
        .map_err(|e| format!("Regex error: {}", e))?;

    if let Some(caps) = re.captures(&body) {
        let title = caps.get(1).unwrap().as_str().trim();
        if !title.is_empty() {
            return Ok(title.to_string());
        }
    }

    // Fallback: return the domain name if title not found
    if let Ok(parsed_url) = url::Url::parse(&url) {
        return Ok(parsed_url
            .host_str()
            .unwrap_or("Новая вкладка")
            .to_string());
    }

    Err("Unable to determine title".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(WebviewState::default())
        .invoke_handler(tauri::generate_handler![
            create_tab_webview,
            show_tab_webview,
            hide_all_webviews,
            close_tab_webview,
            navigate_webview,
            get_webview_info,
            fetch_favicon_backend,
            get_webview_url,
            update_webview_title,
            open_url_in_new_tab
        ])
        .setup(|app| {
            // Добавляем обработчик изменения размера окна для правильного позиционирования webview'ов
            let app_handle = app.app_handle();
            if let Some(main_window) = app.get_window("main") {
                let app_handle_clone = app_handle.clone();
                let _ = main_window.on_window_event(move |event| {
                    if let tauri::WindowEvent::Resized(_) = event {
                        // Клонируем app_handle_clone перед использованием в async move
                        let app_handle_for_async = app_handle_clone.clone();
                        // При изменении размера окна, обновляем позиции всех видимых webview'ов
                        tauri::async_runtime::spawn(async move {
                            let state = app_handle_for_async.state::<WebviewState>();
                            let webviews = state.webviews.lock().unwrap();
                            
                            if let Some(main_window) = app_handle_for_async.get_window("main") {
                                if let Ok(window_size) = main_window.inner_size() {
                                    let position = Position::Logical(LogicalPosition::new(0.0, HEADER_HEIGHT));
                                    let size = Size::Logical(LogicalSize::new(
                                        window_size.width as f64, 
                                        window_size.height as f64 - HEADER_HEIGHT
                                    ));
                                    
                                    for webview_label in webviews.values() {
                                        if let Some(webview) = app_handle_for_async.get_webview(webview_label) {
                                            let _ = webview.set_position(position);
                                            let _ = webview.set_size(size);
                                        }
                                    }
                                }
                            }
                        });
                    }
                });
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
