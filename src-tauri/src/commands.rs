use tauri::{AppHandle, Manager, Emitter};
use crate::state::WebviewState;
use crate::webview::{create_tab_webview_impl, show_tab_webview_impl, hide_all_webviews_impl, close_tab_webview_impl, navigate_webview_impl};
use std::time::SystemTime;

/// Команда для создания нового CHILD webview для вкладки (embedded, ниже UI)
#[tauri::command]
pub async fn create_tab_webview(
    app: AppHandle,
    tab_id: String,
    url: String,
    title: String,
) -> Result<String, String> {
    create_tab_webview_impl(app, tab_id, url, title).await
}

/// Команда для показа webview вкладки
#[tauri::command]
pub async fn show_tab_webview(
    app: AppHandle,
    tab_id: String,
) -> Result<(), String> {
    show_tab_webview_impl(app, tab_id).await
}

/// Команда для скрытия всех webview'ов (для about:blank вкладок)
#[tauri::command]
pub async fn hide_all_webviews(app: AppHandle) -> Result<(), String> {
    hide_all_webviews_impl(app).await
}

/// Команда для закрытия webview вкладки
#[tauri::command]
pub async fn close_tab_webview(
    app: AppHandle,
    tab_id: String,
) -> Result<(), String> {
    close_tab_webview_impl(app, tab_id).await
}

/// Команда для навигации в webview
#[tauri::command]
pub async fn navigate_webview(
    app: AppHandle,
    tab_id: String,
    url: String,
) -> Result<(), String> {
    navigate_webview_impl(app, tab_id, url).await
}

/// Команда для получения текущего URL webview
#[tauri::command]
pub async fn get_webview_url(
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

/// Команда для обновления title вкладки из JavaScript injection
#[tauri::command]
pub async fn update_webview_title(
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

/// Команда для перехода на домашнюю страницу
#[tauri::command]
pub async fn navigate_to_home(
    app: AppHandle,
    tab_id: String,
    home_url: Option<String>,
) -> Result<(), String> {
    // Используем переданный URL или домашнюю страницу по умолчанию
    let url = home_url.unwrap_or_else(|| "https://www.google.com".to_string());
    
    // Используем существующую функцию навигации
    navigate_webview_impl(app, tab_id, url).await
}

/// Команда для отключения звука webview
#[tauri::command]
pub async fn mute_webview(
    app: AppHandle,
    tab_id: String,
) -> Result<(), String> {
    let state = app.state::<WebviewState>();
    let webviews = state.webviews.lock().unwrap();
    
    if let Some(webview_label) = webviews.get(&tab_id) {
        if let Some(webview) = app.get_webview(webview_label) {
            // Выполняем JavaScript для отключения звука всех медиаэлементов
            let script = get_mute_script();
            
            webview.eval(script)
                .map_err(|e| format!("Failed to mute webview: {}", e))?;
            
            println!("🦀 Rust: Webview muted for tab: {}", tab_id);
            Ok(())
        } else {
            Err("Webview not found".to_string())
        }
    } else {
        Err("Tab not found".to_string())
    }
}

/// Команда для включения звука webview
#[tauri::command]
pub async fn unmute_webview(
    app: AppHandle,
    tab_id: String,
) -> Result<(), String> {
    let state = app.state::<WebviewState>();
    let webviews = state.webviews.lock().unwrap();
    
    if let Some(webview_label) = webviews.get(&tab_id) {
        if let Some(webview) = app.get_webview(webview_label) {
            // Выполняем JavaScript для включения звука всех медиаэлементов
            let script = get_unmute_script();
            
            webview.eval(script)
                .map_err(|e| format!("Failed to unmute webview: {}", e))?;
            
            println!("🦀 Rust: Webview unmuted for tab: {}", tab_id);
            Ok(())
        } else {
            Err("Webview not found".to_string())
        }
    } else {
        Err("Tab not found".to_string())
    }
}

/// Команда для открытия URL в новой вкладке (альтернатива opener plugin)
#[tauri::command]
pub async fn open_url_in_new_tab(
    app: AppHandle,
    url: String,
) -> Result<String, String> {
    // Генерируем ID для новой вкладки
    let timestamp = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    let tab_id = format!("tab_{}", timestamp);
    
    // Создаем новый webview для этого URL
    let webview_label = create_tab_webview_impl(app.clone(), tab_id.clone(), url.clone(), "Загрузка...".to_string()).await?;
    
    // Отправляем событие о создании новой вкладки во frontend
    app.emit("new-tab-created", serde_json::json!({
        "tabId": tab_id,
        "url": url,
        "title": "Загрузка...",
        "webviewLabel": webview_label
    })).map_err(|e| format!("Failed to emit new tab event: {}", e))?;
    
    Ok(tab_id)
}

/// Команда для получения информации о webview'ах (для отладки)
#[tauri::command]
pub async fn get_webview_info(app: AppHandle) -> Result<Vec<String>, String> {
    let state = app.state::<WebviewState>();
    let webviews = state.webviews.lock().unwrap();
    
    let mut info = Vec::new();
    for (tab_id, webview_label) in webviews.iter() {
        let exists = app.get_webview(webview_label).is_some();
        info.push(format!("Tab: {}, Label: {}, Exists: {}", tab_id, webview_label, exists));
    }
    
    Ok(info)
}

/// Команда для получения фавиконки через бэкенд
#[tauri::command]
pub async fn fetch_favicon_backend(url: String) -> Result<String, String> {
    crate::utils::fetch_favicon_backend(url).await
}

/// Возвращает скрипт для отключения звука
fn get_mute_script() -> &'static str {
    r#"
        (function() {
            // Отключаем звук всех audio элементов
            document.querySelectorAll('audio').forEach(audio => {
                audio.muted = true;
            });
            
            // Отключаем звук всех video элементов
            document.querySelectorAll('video').forEach(video => {
                video.muted = true;
            });
            
            // Для YouTube и других сайтов с iframe
            document.querySelectorAll('iframe').forEach(iframe => {
                try {
                    iframe.contentWindow.postMessage('{"event":"command","func":"mute","args":[]}', '*');
                } catch(e) {}
            });
            
            console.log('🔇 Tab muted');
        })();
    "#
}

/// Возвращает скрипт для включения звука
fn get_unmute_script() -> &'static str {
    r#"
        (function() {
            // Включаем звук всех audio элементов
            document.querySelectorAll('audio').forEach(audio => {
                audio.muted = false;
            });
            
            // Включаем звук всех video элементов
            document.querySelectorAll('video').forEach(video => {
                video.muted = false;
            });
            
            // Для YouTube и других сайтов с iframe
            document.querySelectorAll('iframe').forEach(iframe => {
                try {
                    iframe.contentWindow.postMessage('{"event":"command","func":"unMute","args":[]}', '*');
                } catch(e) {}
            });
            
            console.log('🔊 Tab unmuted');
        })();
    "#
}

// Подключаем модуль тестов
#[cfg(test)]
mod tests;