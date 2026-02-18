use reqwest;
use tauri::{
    Manager,
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
};

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

      // --- Tray icon ---
      let show_item = MenuItemBuilder::with_id("show", "Show Stash").build(app)?;
      let quit_item = MenuItemBuilder::with_id("quit", "Quit").build(app)?;
      let tray_menu = MenuBuilder::new(app)
          .items(&[&show_item, &quit_item])
          .build()?;

      TrayIconBuilder::new()
          .icon(app.default_window_icon().unwrap().clone())
          .tooltip("Stash")
          .menu(&tray_menu)
          .on_menu_event(|app, event| {
              match event.id().as_ref() {
                  "show" => {
                      if let Some(window) = app.get_webview_window("main") {
                          let _ = window.show();
                          let _ = window.unminimize();
                          let _ = window.set_focus();
                      }
                  }
                  "quit" => {
                      app.exit(0);
                  }
                  _ => {}
              }
          })
          .on_tray_icon_event(|tray, event| {
              if let TrayIconEvent::Click {
                  button: MouseButton::Left,
                  button_state: MouseButtonState::Up,
                  ..
              } = event
              {
                  let app = tray.app_handle();
                  if let Some(window) = app.get_webview_window("main") {
                      let _ = window.show();
                      let _ = window.unminimize();
                      let _ = window.set_focus();
                  }
              }
          })
          .build(app)?;

      Ok(())
    })
    .on_window_event(|window, event| {
        // Minimize to tray instead of quitting when the window is closed
        if let tauri::WindowEvent::CloseRequested { api, .. } = event {
            api.prevent_close();
            let _ = window.hide();
        }
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
