use tauri::{Manager, LogicalPosition, LogicalSize, Position, Size};

// Модули
mod state;
mod webview;
mod commands;
mod utils;

// Импорты из модулей
use state::{WebviewState, HEADER_HEIGHT};
use commands::*;

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
            reload_tab,
            navigate_back,
            navigate_forward,
            navigate_to_home,
            get_webview_info,
            fetch_favicon_backend,
            fetch_page_title_backend,
            get_webview_url,
            update_webview_title,
            open_url_in_new_tab,
            mute_webview,
            unmute_webview
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
