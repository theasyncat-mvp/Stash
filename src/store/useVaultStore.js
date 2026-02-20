import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { v4 as uuidv4 } from 'uuid';
import {
  loadVaultConfig, saveVaultConfig,
  loadVaultMeta, saveVaultMeta,
  loadVaultData, saveVaultData,
} from '../lib/storage.js';

export const useVaultStore = create((set, get) => ({
  isEnabled: false,
  isUnlocked: false,
  isSidebarVisible: true,
  meta: null,       // JSON string stored in stash-vault-meta
  bookmarks: [],    // decrypted, in-memory only — cleared on lock
  _password: null,  // in-memory only — cleared on lock

  load: async () => {
    const [config, meta] = await Promise.all([loadVaultConfig(), loadVaultMeta()]);
    set({
      isEnabled: config?.enabled ?? false,
      isSidebarVisible: config?.sidebarVisible ?? true,
      meta: meta ?? null,
    });
  },

  // First-time setup: generate salt + sentinel, persist, unlock immediately
  setup: async (password) => {
    const meta = await invoke('vault_setup', { password });
    await saveVaultMeta(meta);
    await saveVaultData('');
    await saveVaultConfig({ enabled: true, sidebarVisible: get().isSidebarVisible });
    set({ isEnabled: true, meta, isUnlocked: true, bookmarks: [], _password: password });
  },

  // Verify password and load decrypted bookmarks into memory
  unlock: async (password) => {
    const { meta } = get();
    if (!meta) return false;

    const valid = await invoke('vault_verify', { password, meta });
    if (!valid) return false;

    const ciphertext = await loadVaultData();
    let bookmarks = [];
    if (ciphertext && ciphertext.trim()) {
      try {
        const plaintext = await invoke('vault_decrypt', { password, meta, ciphertext });
        bookmarks = JSON.parse(plaintext);
      } catch {
        // corrupted data — start fresh
        bookmarks = [];
      }
    }

    set({ isUnlocked: true, bookmarks, _password: password });
    return true;
  },

  // Clear decrypted data from memory
  lock: () => {
    set({ isUnlocked: false, bookmarks: [], _password: null });
  },

  // Persist current in-memory bookmarks as encrypted blob
  _save: async () => {
    const { bookmarks, meta, _password } = get();
    if (!meta || !_password) return;
    const plaintext = JSON.stringify(bookmarks);
    const ciphertext = await invoke('vault_encrypt', { password: _password, meta, plaintext });
    await saveVaultData(ciphertext);
  },

  addBookmark: async (data) => {
    const now = Date.now();
    const bookmark = {
      id: uuidv4(),
      url: data.url,
      title: data.title || data.url,
      description: data.description || '',
      favicon: data.favicon || null,
      ogImage: data.ogImage || null,
      tags: data.tags || [],
      notes: '',
      createdAt: now,
      updatedAt: now,
    };
    const bookmarks = [bookmark, ...get().bookmarks];
    set({ bookmarks });
    await get()._save();
    return bookmark.id;
  },

  updateBookmark: async (id, changes) => {
    const bookmarks = get().bookmarks.map((b) =>
      b.id === id ? { ...b, ...changes, updatedAt: Date.now() } : b
    );
    set({ bookmarks });
    await get()._save();
  },

  deleteBookmark: async (id) => {
    const bookmarks = get().bookmarks.filter((b) => b.id !== id);
    set({ bookmarks });
    await get()._save();
  },

  toggleSidebarVisible: async () => {
    const isSidebarVisible = !get().isSidebarVisible;
    set({ isSidebarVisible });
    await saveVaultConfig({ enabled: get().isEnabled, sidebarVisible: isSidebarVisible });
  },

  changePassword: async (oldPassword, newPassword) => {
    const { meta } = get();
    const ciphertext = await loadVaultData();
    const [newMeta, newCiphertext] = await invoke('vault_change_password', {
      oldPassword,
      newPassword,
      meta,
      ciphertext: ciphertext ?? '',
    });
    await saveVaultMeta(newMeta);
    await saveVaultData(newCiphertext);
    set({ meta: newMeta, _password: newPassword });
    return true;
  },

  // Verify password then wipe all vault data
  remove: async (password) => {
    const { meta } = get();
    const valid = await invoke('vault_verify', { password, meta });
    if (!valid) return false;
    await saveVaultConfig({ enabled: false, sidebarVisible: true });
    await saveVaultMeta(null);
    await saveVaultData(null);
    set({
      isEnabled: false, isUnlocked: false,
      bookmarks: [], meta: null, _password: null, isSidebarVisible: true,
    });
    return true;
  },
}));
