use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Key, Nonce,
};
use base64::prelude::*;
use pbkdf2::pbkdf2_hmac;
use rand::{rngs::OsRng, RngCore};
use reqwest;
use serde::{Deserialize, Serialize};
use sha2::Sha256;
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

// ── Vault encryption helpers ─────────────────────────────────────────────────

fn derive_key(password: &str, salt: &[u8]) -> [u8; 32] {
    let mut key = [0u8; 32];
    pbkdf2_hmac::<Sha256>(password.as_bytes(), salt, 100_000, &mut key);
    key
}

fn vault_encrypt_inner(password: &str, salt_b64: &str, plaintext: &str) -> Result<String, String> {
    let salt = BASE64_STANDARD.decode(salt_b64).map_err(|e| e.to_string())?;
    let key_bytes = derive_key(password, &salt);
    let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);

    let mut nonce_bytes = [0u8; 12];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, plaintext.as_bytes())
        .map_err(|_| "Encryption failed".to_string())?;

    let mut combined = nonce_bytes.to_vec();
    combined.extend_from_slice(&ciphertext);
    Ok(BASE64_STANDARD.encode(&combined))
}

fn vault_decrypt_inner(password: &str, salt_b64: &str, ciphertext_b64: &str) -> Result<String, String> {
    let salt = BASE64_STANDARD.decode(salt_b64).map_err(|e| e.to_string())?;
    let combined = BASE64_STANDARD.decode(ciphertext_b64).map_err(|e| e.to_string())?;
    if combined.len() < 12 {
        return Err("Invalid ciphertext".to_string());
    }
    let (nonce_bytes, ct) = combined.split_at(12);
    let key_bytes = derive_key(password, &salt);
    let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);
    let nonce = Nonce::from_slice(nonce_bytes);
    let plaintext = cipher
        .decrypt(nonce, ct)
        .map_err(|_| "Decryption failed: wrong password or corrupted data".to_string())?;
    String::from_utf8(plaintext).map_err(|e| e.to_string())
}

fn parse_salt(meta: &str) -> Result<String, String> {
    let v: serde_json::Value = serde_json::from_str(meta).map_err(|e| e.to_string())?;
    v["salt"].as_str().map(|s| s.to_string()).ok_or_else(|| "missing salt".to_string())
}

/// First-time vault setup: generate salt, encrypt sentinel, return meta JSON.
#[tauri::command]
fn vault_setup(password: String) -> Result<String, String> {
    let mut salt = [0u8; 16];
    OsRng.fill_bytes(&mut salt);
    let salt_b64 = BASE64_STANDARD.encode(&salt);
    let sentinel = vault_encrypt_inner(&password, &salt_b64, "stash-vault-ok")?;
    Ok(serde_json::json!({ "salt": salt_b64, "sentinel": sentinel }).to_string())
}

/// Verify a password against the stored meta. Returns true if correct.
#[tauri::command]
fn vault_verify(password: String, meta: String) -> Result<bool, String> {
    let v: serde_json::Value = serde_json::from_str(&meta).map_err(|e| e.to_string())?;
    let salt = v["salt"].as_str().ok_or("missing salt")?;
    let sentinel = v["sentinel"].as_str().ok_or("missing sentinel")?;
    match vault_decrypt_inner(&password, salt, sentinel) {
        Ok(s) => Ok(s == "stash-vault-ok"),
        Err(_) => Ok(false),
    }
}

/// Encrypt plaintext JSON with the password derived from meta.
#[tauri::command]
fn vault_encrypt(password: String, meta: String, plaintext: String) -> Result<String, String> {
    let salt = parse_salt(&meta)?;
    vault_encrypt_inner(&password, &salt, &plaintext)
}

/// Decrypt ciphertext with the password derived from meta.
#[tauri::command]
fn vault_decrypt(password: String, meta: String, ciphertext: String) -> Result<String, String> {
    let salt = parse_salt(&meta)?;
    vault_decrypt_inner(&password, &salt, &ciphertext)
}

/// Re-encrypt vault data with a new password. Returns (new_meta, new_ciphertext).
#[tauri::command]
fn vault_change_password(
    old_password: String,
    new_password: String,
    meta: String,
    ciphertext: String,
) -> Result<(String, String), String> {
    let v: serde_json::Value = serde_json::from_str(&meta).map_err(|e| e.to_string())?;
    let old_salt = v["salt"].as_str().ok_or("missing salt")?;
    let sentinel = v["sentinel"].as_str().ok_or("missing sentinel")?;

    // Verify old password
    let ok = match vault_decrypt_inner(&old_password, old_salt, sentinel) {
        Ok(s) => s == "stash-vault-ok",
        Err(_) => false,
    };
    if !ok {
        return Err("Invalid old password".to_string());
    }

    // Decrypt existing data (may be empty)
    let plaintext = if ciphertext.is_empty() {
        "[]".to_string()
    } else {
        vault_decrypt_inner(&old_password, old_salt, &ciphertext)?
    };

    // Generate new salt and re-encrypt everything
    let mut new_salt = [0u8; 16];
    OsRng.fill_bytes(&mut new_salt);
    let new_salt_b64 = BASE64_STANDARD.encode(&new_salt);
    let new_sentinel = vault_encrypt_inner(&new_password, &new_salt_b64, "stash-vault-ok")?;
    let new_meta = serde_json::json!({ "salt": new_salt_b64, "sentinel": new_sentinel }).to_string();
    let new_ciphertext = vault_encrypt_inner(&new_password, &new_salt_b64, &plaintext)?;
    Ok((new_meta, new_ciphertext))
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
    .invoke_handler(tauri::generate_handler![
        fetch_url,
        vault_setup,
        vault_verify,
        vault_encrypt,
        vault_decrypt,
        vault_change_password,
    ])
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
        // Show the window when the user clicks the dock icon (macOS only)
        #[cfg(target_os = "macos")]
        if let tauri::RunEvent::Reopen { .. } = event {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
        #[cfg(not(target_os = "macos"))]
        let _ = (app, event);
    });
}
