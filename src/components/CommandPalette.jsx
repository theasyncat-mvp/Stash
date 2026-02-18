import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search, Inbox, Bookmark, Star, Archive, Tag, Rss, FolderOpen,
  Plus, Sun, Moon, Grid3X3, List, Download, Upload,
} from 'lucide-react';
import { useBookmarkStore, useAllTags } from '../store/useBookmarkStore.js';
import { useFeedStore } from '../store/useFeedStore.js';

export default function CommandPalette({ onClose, onAddBookmark, onAddFeed, onAddCollection }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const { bookmarks, collections, setActiveView, setViewMode } = useBookmarkStore();
  const { feeds } = useFeedStore();
  const allTags = useAllTags();

  const commands = useMemo(() => {
    const cmds = [
      { id: 'nav-inbox', label: 'Go to Inbox', icon: Inbox, section: 'Navigation', action: () => { setActiveView('inbox'); onClose(); } },
      { id: 'nav-all', label: 'Go to All Bookmarks', icon: Bookmark, section: 'Navigation', action: () => { setActiveView('all'); onClose(); } },
      { id: 'nav-favorites', label: 'Go to Favorites', icon: Star, section: 'Navigation', action: () => { setActiveView('favorites'); onClose(); } },
      { id: 'nav-archive', label: 'Go to Archive', icon: Archive, section: 'Navigation', action: () => { setActiveView('archive'); onClose(); } },
      { id: 'add-bookmark', label: 'Add Bookmark', icon: Plus, section: 'Actions', action: () => { onClose(); setTimeout(onAddBookmark, 100); } },
      { id: 'add-feed', label: 'Subscribe to Feed', icon: Rss, section: 'Actions', action: () => { onClose(); setTimeout(onAddFeed, 100); } },
      { id: 'add-collection', label: 'New Collection', icon: FolderOpen, section: 'Actions', action: () => { onClose(); setTimeout(onAddCollection, 100); } },
      { id: 'view-grid', label: 'Switch to Grid View', icon: Grid3X3, section: 'View', action: () => { setViewMode('grid'); onClose(); } },
      { id: 'view-list', label: 'Switch to List View', icon: List, section: 'View', action: () => { setViewMode('list'); onClose(); } },
    ];

    allTags.forEach((tag) => {
      cmds.push({
        id: `tag-${tag.name}`,
        label: `Tag: ${tag.name}`,
        icon: Tag,
        section: 'Tags',
        meta: `${tag.count} bookmarks`,
        action: () => { setActiveView(`tag:${tag.name}`); onClose(); },
      });
    });

    feeds.forEach((feed) => {
      cmds.push({
        id: `feed-${feed.id}`,
        label: feed.title,
        icon: Rss,
        section: 'Feeds',
        action: () => { setActiveView(`feed:${feed.id}`); onClose(); },
      });
    });

    collections.forEach((col) => {
      cmds.push({
        id: `col-${col.id}`,
        label: col.name,
        icon: FolderOpen,
        section: 'Collections',
        action: () => { setActiveView(`collection:${col.id}`); onClose(); },
      });
    });

    if (query.trim()) {
      const q = query.toLowerCase();
      const matchingBookmarks = bookmarks
        .filter((b) =>
          (b.title && b.title.toLowerCase().includes(q)) ||
          (b.url && b.url.toLowerCase().includes(q))
        )
        .slice(0, 8);

      matchingBookmarks.forEach((b) => {
        cmds.unshift({
          id: `bm-${b.id}`,
          label: b.title || b.url,
          icon: Bookmark,
          section: 'Bookmarks',
          meta: (() => { try { return new URL(b.url).hostname; } catch { return ''; } })(),
          action: () => {
            useBookmarkStore.getState().setSelectedBookmark(b.id);
            onClose();
          },
        });
      });
    }

    return cmds;
  }, [query, bookmarks, collections, feeds, allTags, setActiveView, setViewMode, onClose, onAddBookmark, onAddFeed, onAddCollection]);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter((c) => c.label.toLowerCase().includes(q) || (c.meta && c.meta.toLowerCase().includes(q)));
  }, [commands, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const el = listRef.current?.children[selectedIndex];
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const sections = {};
  filtered.forEach((cmd) => {
    if (!sections[cmd.section]) sections[cmd.section] = [];
    sections[cmd.section].push(cmd);
  });

  let flatIndex = -1;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] bg-black/30 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <Search size={16} className="text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search bookmarks, commands, tags..."
            className="flex-1 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
          />
          <kbd className="text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">ESC</kbd>
        </div>
        <div ref={listRef} className="max-h-80 overflow-y-auto py-1">
          {Object.entries(sections).map(([section, cmds]) => (
            <div key={section}>
              <div className="px-4 pt-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-zinc-400">{section}</div>
              {cmds.map((cmd) => {
                flatIndex++;
                const idx = flatIndex;
                const Icon = cmd.icon;
                return (
                  <button
                    key={cmd.id}
                    onClick={() => cmd.action()}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors duration-75 cursor-pointer ${
                      idx === selectedIndex
                        ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <Icon size={14} className="shrink-0" />
                    <span className="text-sm truncate flex-1">{cmd.label}</span>
                    {cmd.meta && <span className="text-xs text-zinc-400 dark:text-zinc-500 shrink-0">{cmd.meta}</span>}
                  </button>
                );
              })}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-zinc-400 dark:text-zinc-500">No results found</div>
          )}
        </div>
        <div className="px-4 py-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-4 text-[10px] text-zinc-400">
          <span><kbd className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">↑↓</kbd> navigate</span>
          <span><kbd className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">↵</kbd> select</span>
          <span><kbd className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
