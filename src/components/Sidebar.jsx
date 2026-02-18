import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  Inbox, Bookmark, Star, Archive, Tag,
  ChevronRight, ChevronDown, PanelLeftClose, PanelLeft, Command, Keyboard,
} from 'lucide-react';
import { useBookmarkStore, useAllTags, useInboxCount } from '../store/useBookmarkStore.js';
import SearchBar from './SearchBar.jsx';
import FeedList from './FeedList.jsx';
import CollectionList from './CollectionList.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import ImportExport from './ImportExport.jsx';
import KeyboardShortcuts from './KeyboardShortcuts.jsx';

const navItems = [
  { id: 'inbox', label: 'Inbox', icon: Inbox, key: '1' },
  { id: 'all', label: 'All Bookmarks', icon: Bookmark, key: '2' },
  { id: 'favorites', label: 'Favorites', icon: Star, key: '3', droppable: true },
  { id: 'archive', label: 'Archive', icon: Archive, key: '4', droppable: true },
];

export default function Sidebar({ collapsed, onToggle, onAddFeed, onAddCollection, onMobileClose }) {
  const { activeView, setActiveView } = useBookmarkStore();
  const [tagsOpen, setTagsOpen] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const inboxCount = useInboxCount();
  const tags = useAllTags();

  const handleNav = (view) => {
    setActiveView(view);
    onMobileClose?.();
  };

  if (collapsed) {
    return (
      <div className="w-12 shrink-0 bg-zinc-100 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col items-center py-3">
        <button
          onClick={onToggle}
          className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors duration-150 cursor-pointer mb-4"
        >
          <PanelLeft size={16} />
        </button>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`relative p-2 rounded-lg mb-1 transition-colors duration-150 cursor-pointer ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400'
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
              }`}
              title={item.label}
            >
              <Icon size={16} />
              {item.id === 'inbox' && inboxCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-blue-500 rounded-full text-[8px] text-white flex items-center justify-center font-bold">
                  {inboxCount > 9 ? '9+' : inboxCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="w-64 shrink-0 bg-zinc-100 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between">
        <span className="text-sm font-semibold tracking-wider text-zinc-400 uppercase">Stash</span>
        <button
          onClick={onToggle}
          className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors duration-150 cursor-pointer"
        >
          <PanelLeftClose size={16} />
        </button>
      </div>

      <SearchBar />

      <nav className="flex-1 overflow-y-auto px-2 py-1 space-y-5">
        <div className="space-y-0.5">
          {navItems.map((item) => (
            <DroppableNavItem
              item={item}
              isActive={activeView === item.id}
              inboxCount={item.id === 'inbox' ? inboxCount : 0}
              onNav={handleNav}
            />
          ))}
        </div>

        <div>
          <button
            onClick={() => setTagsOpen(!tagsOpen)}
            className="flex items-center gap-1 px-3 mb-2 cursor-pointer"
          >
            {tagsOpen ? <ChevronDown size={12} className="text-zinc-400" /> : <ChevronRight size={12} className="text-zinc-400" />}
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Tags</span>
            <span className="text-[10px] text-zinc-300 dark:text-zinc-600 ml-1">{tags.length}</span>
          </button>
          {tagsOpen && (
            <div className="space-y-0.5">
              {tags.map((tag) => (
                <DroppableTagItem
                  key={tag.name}
                  tag={tag}
                  isActive={activeView === `tag:${tag.name}`}
                  onNav={handleNav}
                />
              ))}
              {tags.length === 0 && (
                <p className="px-3 text-xs text-zinc-400 dark:text-zinc-500">No tags yet</p>
              )}
            </div>
          )}
        </div>

        <FeedList onAddFeed={onAddFeed} />
        <CollectionList onAddCollection={onAddCollection} />
      </nav>

      <div className="px-3 py-2 border-t border-zinc-200 dark:border-zinc-800 space-y-1">
        <div className="flex items-center justify-between">
          <ThemeToggle />
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowShortcuts(true)}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors duration-150 cursor-pointer"
              title="Keyboard shortcuts (?)"
            >
              <Keyboard size={15} />
            </button>
            <ImportExport />
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-zinc-300 dark:text-zinc-600 px-1">
          <Command size={9} />
          <span>Ctrl+K for command palette</span>
        </div>
      </div>

      {showShortcuts && <KeyboardShortcuts onClose={() => setShowShortcuts(false)} />}
    </div>
  );
}

/* ── Droppable nav item (favorites, archive accept drops) ── */
function DroppableNavItem({ item, isActive, inboxCount, onNav }) {
  const Icon = item.icon;
  const { setNodeRef, isOver } = useDroppable({
    id: `nav-${item.id}`,
    data: { type: 'nav', id: item.id },
    disabled: !item.droppable,
  });

  return (
    <button
      ref={item.droppable ? setNodeRef : undefined}
      onClick={() => onNav(item.id)}
      className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-left transition-colors duration-150 cursor-pointer ${
        isOver
          ? 'bg-blue-100 dark:bg-blue-500/20 ring-2 ring-blue-400/50'
          : isActive
            ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
            : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800'
      }`}
    >
      <Icon size={16} />
      <span className="text-sm flex-1">{item.label}</span>
      {item.id === 'inbox' && inboxCount > 0 && (
        <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded-full min-w-20px text-center font-medium">
          {inboxCount}
        </span>
      )}
    </button>
  );
}

/* ── Droppable tag item ── */
function DroppableTagItem({ tag, isActive, onNav }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `tag-${tag.name}`,
    data: { type: 'tag', id: tag.name },
  });

  return (
    <button
      ref={setNodeRef}
      onClick={() => onNav(`tag:${tag.name}`)}
      className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-left transition-colors duration-150 cursor-pointer ${
        isOver
          ? 'bg-blue-100 dark:bg-blue-500/20 ring-2 ring-blue-400/50'
          : isActive
            ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
            : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800'
      }`}
    >
      <Tag size={14} className="shrink-0" />
      <span className="text-sm truncate flex-1">{tag.name}</span>
      <span className="text-xs text-zinc-400 dark:text-zinc-500">{tag.count}</span>
    </button>
  );
}
