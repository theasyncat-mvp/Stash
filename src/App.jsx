import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { useBookmarkStore } from './store/useBookmarkStore.js';
import { useFeedStore } from './store/useFeedStore.js';
import { useThemeStore } from './store/useThemeStore.js';
import { useConfirmStore } from './store/useConfirmStore.js';
import { useVaultStore } from './store/useVaultStore.js';
import Layout from './components/Layout.jsx';
import ConfirmDialog from './components/ConfirmDialog.jsx';

export default function App() {
  const loadAll = useBookmarkStore((s) => s.loadAll);
  const loaded = useBookmarkStore((s) => s.loaded);
  const loadFeeds = useFeedStore((s) => s.loadFeeds);
  const initTheme = useThemeStore((s) => s.initTheme);

  useEffect(() => {
    loadAll();
    loadFeeds();
    initTheme();
    useVaultStore.getState().load();
  }, [loadAll, loadFeeds, initTheme]);

  // Lock vault when app window loses focus (if vault view is active)
  useEffect(() => {
    let unlisten;
    getCurrentWindow().listen('tauri://blur', () => {
      if (useBookmarkStore.getState().activeView === 'vault') {
        useVaultStore.getState().lock();
      }
    }).then((fn) => { unlisten = fn; });
    return () => { unlisten?.(); };
  }, []);

  // Check for updates silently on startup
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const update = await check();
        if (!update) return;
        const confirmed = await useConfirmStore.getState().confirm({
          title: `Update available: v${update.version}`,
          message: update.body || 'A new version of Stash is available. Install now?',
          confirmLabel: 'Install & Restart',
        });
        if (confirmed) {
          await update.downloadAndInstall();
          await relaunch();
        }
      } catch (e) {
        console.error('[updater] check failed:', e);
      }
    };
    checkForUpdates();
  }, []);

  // Listen for bookmarks saved from the browser extension
  useEffect(() => {
    const unlisten = listen('extension-save-bookmark', (event) => {
      const { url, tags } = event.payload;
      if (url) {
        useBookmarkStore.getState().addBookmark(url, tags || []);
      }
    });
    return () => { unlisten.then((fn) => fn()); };
  }, []);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FAFAFA] dark:bg-zinc-950">
        <div className="text-sm text-zinc-400 dark:text-zinc-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Layout />
      <ConfirmDialog />
    </div>
  );
}
