import { useState } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { RefreshCw } from 'lucide-react';
import { useConfirmStore } from '../store/useConfirmStore.js';
import { useToastStore } from '../store/useToastStore.js';

export default function UpdateChecker() {
  const [checking, setChecking] = useState(false);

  const handleCheck = async () => {
    if (checking) return;
    setChecking(true);
    try {
      const update = await check();
      if (!update) {
        useToastStore.getState().success("You're on the latest version!");
        return;
      }
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
      useToastStore.getState().error('Update check failed. Check your connection.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <button
      onClick={handleCheck}
      disabled={checking}
      className={`p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors duration-150 cursor-pointer ${checking ? 'opacity-60 cursor-not-allowed' : ''}`}
      title="Check for updates"
    >
      <RefreshCw size={15} className={checking ? 'animate-spin' : ''} />
    </button>
  );
}
