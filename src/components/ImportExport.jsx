import { Download, Upload, MoreHorizontal } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
import { readTextFile } from '@tauri-apps/plugin-fs';
import { useBookmarkStore } from '../store/useBookmarkStore.js';
import { useFeedStore } from '../store/useFeedStore.js';
import { useToastStore } from '../store/useToastStore.js';
import { exportBookmarks, importBookmarks, exportBookmarksAsHTML, importBookmarksFromHTML } from '../lib/export.js';
import Dropdown from './ui/Dropdown.jsx';

export default function ImportExport() {
  const { bookmarks, importBookmarksData } = useBookmarkStore();
  const { exportOPML, importOPML } = useFeedStore();

  const handleExportJSON = async (close) => {
    try {
      await exportBookmarks(bookmarks);
      useToastStore.getState().success('Bookmarks exported as JSON');
    } catch {
      useToastStore.getState().error('Export failed');
    }
    close();
  };

  const handleExportHTML = async (close) => {
    try {
      await exportBookmarksAsHTML(bookmarks);
      useToastStore.getState().success('Bookmarks exported as HTML');
    } catch {
      useToastStore.getState().error('Export failed');
    }
    close();
  };

  const handleImport = async (close) => {
    close();
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

  const handleImportOPML = async (close) => {
    close();
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
    <Dropdown
      align="right"
      direction="up"
      trigger={({ ref, toggle, ariaProps }) => (
        <button
          ref={ref}
          onClick={toggle}
          {...ariaProps}
          className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors duration-150 cursor-pointer"
          aria-label="Import / Export"
        >
          <MoreHorizontal size={14} aria-hidden="true" />
        </button>
      )}
    >
      {({ close }) => (
        <>
          <Dropdown.Label>Bookmarks</Dropdown.Label>
          <Dropdown.Item onClick={() => handleExportJSON(close)}>
            <Download size={14} aria-hidden="true" /> Export as JSON
          </Dropdown.Item>
          <Dropdown.Item onClick={() => handleExportHTML(close)}>
            <Download size={14} aria-hidden="true" /> Export as HTML
          </Dropdown.Item>
          <Dropdown.Item onClick={() => handleImport(close)}>
            <Upload size={14} aria-hidden="true" /> Import (JSON/HTML)
          </Dropdown.Item>
          <Dropdown.Divider />
          <Dropdown.Label>Feeds</Dropdown.Label>
          <Dropdown.Item onClick={() => { exportOPML(); close(); }}>
            <Download size={14} aria-hidden="true" /> Export feeds (OPML)
          </Dropdown.Item>
          <Dropdown.Item onClick={() => handleImportOPML(close)}>
            <Upload size={14} aria-hidden="true" /> Import feeds (OPML)
          </Dropdown.Item>
        </>
      )}
    </Dropdown>
  );
}
