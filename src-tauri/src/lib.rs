use reqwest;

/// Fetch a URL directly from the Rust backend — bypasses CORS entirely.
/// Returns the response body as a UTF-8 string.
#[tauri::command]
async fn fetch_url(url: String) -> Result<String, String> {
    let client = reqwest::Client::builder()
        .user_agent("Stash/0.1 (https://github.com/nicosql/Stash)")
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| format!("HTTP client error: {e}"))?;

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Fetch failed for {url}: {e}"))?;

    if !response.status().is_success() {
        return Err(format!(
            "HTTP {} for {url}",
            response.status()
        ));
    }

    response
        .text()
        .await
        .map_err(|e| format!("Failed to read response body: {e}"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_store::Builder::new().build())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_shell::init())
    .invoke_handler(tauri::generate_handler![fetch_url])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
