import { invoke } from '@tauri-apps/api/core';

/**
 * Fetch a URL through the Tauri Rust backend (no CORS proxy needed).
 * @param {string} url - The URL to fetch.
 * @returns {Promise<string>} The response body as text.
 */
export async function fetchUrl(url) {
  return invoke('fetch_url', { url });
}
