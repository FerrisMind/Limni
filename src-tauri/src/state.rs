use std::collections::HashMap;
use std::sync::Mutex;

/// Состояние для отслеживания webview'ов
#[derive(Default)]
pub struct WebviewState {
    pub webviews: Mutex<HashMap<String, String>>, // tab_id -> webview_label
}

/// Константа для правильной высоты header'а
/// TabBar (40px) + Toolbar (40px) = 80.0px
pub const HEADER_HEIGHT: f64 = 80.0; 