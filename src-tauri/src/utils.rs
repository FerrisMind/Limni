use reqwest::Client;
use base64::{engine::general_purpose, Engine as _};

/// Команда для получения фавиконки через бэкенд
pub async fn fetch_favicon_backend(url: String) -> Result<String, String> {
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

/// Utility: Fetch real <title> of a page for more accurate tab titles
pub async fn fetch_page_title_backend(url: String) -> Result<String, String> {
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

/// Определяет title на основе URL (как fallback)
pub fn get_title_from_url(url_str: &str) -> String {
    if url_str.contains("yandex.ru") {
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
        if let Ok(parsed_url) = url::Url::parse(url_str) {
            parsed_url.host_str().unwrap_or("Новая вкладка").to_string()
        } else {
            "Новая вкладка".to_string()
        }
    }
} 