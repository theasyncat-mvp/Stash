use reqwest;
use serde::{Deserialize, Serialize};
use tauri::{
    Emitter, Manager,
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
};
use axum::{Json, Router, routing::{get, post}, http::StatusCode};
use tower_http::cors::CorsLayer;

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

// ── Extension HTTP server ────────────────────────────────────────────────────

const EXTENSION_PORT: u16 = 21890;

#[derive(Deserialize)]
struct ExtensionBookmark {
    url: String,
    title: Option<String>,
    description: Option<String>,
    tags: Option<Vec<String>>,
}

#[derive(Serialize, Clone)]
struct ExtensionBookmarkEvent {
    url: String,
    title: Option<String>,
    description: Option<String>,
    tags: Vec<String>,
}

/// Start a tiny HTTP server on 127.0.0.1:21890 that the browser extension
/// can POST bookmarks to. The server emits a Tauri event so the frontend
/// can pick it up and call addBookmark().
async fn start_extension_server(app: tauri::AppHandle) {
    let app_save = app.clone();
    let app_show = app.clone();

    let router = Router::new()
        .route("/api/ping", get(|| async {
            Json(serde_json::json!({ "status": "ok", "app": "Stash" }))
        }))
        .route("/api/bookmark", post(move |Json(payload): Json<ExtensionBookmark>| {
            let handle = app_save.clone();
            async move {
                let event = ExtensionBookmarkEvent {
                    url: payload.url,
                    title: payload.title,
                    description: payload.description,
                    tags: payload.tags.unwrap_or_default(),
                };
                match handle.emit("extension-save-bookmark", &event) {
                    Ok(_) => (StatusCode::OK, Json(serde_json::json!({ "status": "saved" }))),
                    Err(e) => (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(serde_json::json!({ "status": "error", "message": format!("{e}") })),
                    ),
                }
            }
        }))
        .route("/api/show", post(move || {
            let handle = app_show.clone();
            async move {
                if let Some(window) = handle.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.unminimize();
                    let _ = window.set_focus();
                }
                Json(serde_json::json!({ "status": "ok" }))
            }
        }))
        .layer(CorsLayer::permissive());

    match tokio::net::TcpListener::bind(format!("127.0.0.1:{EXTENSION_PORT}")).await {
        Ok(listener) => {
            log::info!("Extension server listening on 127.0.0.1:{EXTENSION_PORT}");
            if let Err(e) = axum::serve(listener, router).await {
                log::error!("Extension server error: {e}");
            }
        }
        Err(e) => {
            log::warn!("Could not start extension server on port {EXTENSION_PORT}: {e}");
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_store::Builder::new().build())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(tauri_plugin_process::init())
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

      // --- Extension HTTP server (background task) ---
      let handle = app.handle().clone();
      tauri::async_runtime::spawn(start_extension_server(handle));

      Ok(())
    })
    .on_window_event(|window, event| {
        // Minimize to tray instead of quitting when the window is closed
        if let tauri::WindowEvent::CloseRequested { api, .. } = event {
            api.prevent_close();
            if window.is_fullscreen().unwrap_or(false) {
                // Exit fullscreen first, then wait for the macOS animation to
                // finish before hiding — otherwise the window briefly appears
                // in windowed mode and a black space is left behind.
                let w = window.clone();
                tauri::async_runtime::spawn(async move {
                    let _ = w.set_fullscreen(false);
                    tokio::time::sleep(std::time::Duration::from_millis(600)).await;
                    let _ = w.hide();
                });
            } else {
                let _ = window.hide();
            }
        }
    })
    .build(tauri::generate_context!())
    .expect("error while building tauri application")
    .run(|app, event| {
        // Show the window when the user clicks the dock icon on macOS
        if let tauri::RunEvent::Reopen { .. } = event {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
    });
}
