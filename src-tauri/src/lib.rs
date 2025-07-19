use tauri::{Manager, LogicalPosition, LogicalSize, AppHandle, WebviewUrl, Position, Size};
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
        .initialization_script("
            // Child WebView инициализация
            document.addEventListener('DOMContentLoaded', function() {
                document.body.style.margin = '0';
                document.body.style.padding = '0';
                // Child WebView автоматически ниже UI родителя
            });
        ");
    
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
            fetch_favicon_backend
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
