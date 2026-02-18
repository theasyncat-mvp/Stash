import { useState } from 'react';
import { Download, Upload, MoreHorizontal } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
import { readTextFile } from '@tauri-apps/plugin-fs';
import { useBookmarkStore } from '../store/useBookmarkStore.js';
import { useFeedStore } from '../store/useFeedStore.js';
import { useToastStore } from '../store/useToastStore.js';
import { exportBookmarks, importBookmarks, exportBookmarksAsHTML, importBookmarksFromHTML } from '../lib/export.js';

export default function ImportExport() {
  const [showMenu, setShowMenu] = useState(false);
  const { bookmarks, importBookmarksData } = useBookmarkStore();
  const { exportOPML, importOPML } = useFeedStore();

  const handleExportJSON = async () => {
    try {
      await exportBookmarks(bookmarks);
      useToastStore.getState().success('Bookmarks exported as JSON');
    } catch {
      useToastStore.getState().error('Export failed');
    }
    setShowMenu(false);
  };

  const handleExportHTML = async () => {
    try {
      await exportBookmarksAsHTML(bookmarks);
      useToastStore.getState().success('Bookmarks exported as HTML');
    } catch {
      useToastStore.getState().error('Export failed');
    }
    setShowMenu(false);
  };

  const handleImport = async () => {
    setShowMenu(false);
    try {
      const filePath = await open({
        multiple: false,
        filters: [{ name: 'Bookmarks', extensions: ['json', 'html', 'htm'] }],
      });
      if (!filePath) return;
      const text = await readTextFile(filePath);
      let result;
      if (filePath.endsWith('.html') || filePath.endsWith('.htm')) {
        result = importBookmarksFromHTML(text, bookmarks);
      } else {
        result = importBookmarks(text, bookmarks);
      }
      if (result.bookmarks.length > 0) {
        await importBookmarksData(result.bookmarks);
      }
      useToastStore.getState().success(`Imported ${result.imported} bookmarks, skipped ${result.skipped} duplicates`);
    } catch (err) {
      useToastStore.getState().error('Import failed: ' + err.message);
    }
  };

  const handleImportOPML = async () => {
    setShowMenu(false);
    try {
      const filePath = await open({
        multiple: false,
        filters: [{ name: 'OPML', extensions: ['opml', 'xml'] }],
      });
      if (!filePath) return;
      const text = await readTextFile(filePath);
      await importOPML(text);
    } catch (err) {
      useToastStore.getState().error('OPML import failed: ' + err.message);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors duration-150 cursor-pointer"
        title="Import / Export"
      >
        <MoreHorizontal size={14} />
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
          <div className="absolute bottom-full right-0 mb-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg py-1 min-w-[200px] z-40 animate-scaleIn">
            <div className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400">Bookmarks</div>
            <button onClick={handleExportJSON} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
              <Download size={14} /> Export as JSON
            </button>
            <button onClick={handleExportHTML} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
              <Download size={14} /> Export as HTML
            </button>
            <button onClick={handleImport} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
              <Upload size={14} /> Import (JSON/HTML)
            </button>
            <div className="border-t border-zinc-100 dark:border-zinc-800 my-1" />
            <div className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400">Feeds</div>
            <button onClick={() => { exportOPML(); setShowMenu(false); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
              <Download size={14} /> Export feeds (OPML)
            </button>
            <button onClick={handleImportOPML} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
              <Upload size={14} /> Import feeds (OPML)
            </button>
          </div>
        </>
      )}
    </div>
  );
}
