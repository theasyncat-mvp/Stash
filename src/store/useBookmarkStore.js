import { create } from 'zustand';
import { useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { loadBookmarks, saveBookmarks, loadCollections, saveCollections } from '../lib/storage.js';
import { fetchMetadata } from '../lib/metadata.js';
import { searchBookmarks } from '../lib/search.js';
import { useToastStore } from './useToastStore.js';
import { useConfirmStore } from './useConfirmStore.js';

function normalizeUrl(url) {
  try {
    const u = new URL(url);
    let normalized = u.origin + u.pathname.replace(/\/+$/, '') + u.search;
    return normalized.toLowerCase();
  } catch {
    return url.toLowerCase().trim();
  }
}

function estimateReadingTime(text) {
  if (!text) return 0;
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export const useBookmarkStore = create((set, get) => ({
  bookmarks: [],
  collections: [],
  activeView: 'inbox',
  searchQuery: '',
  viewMode: 'grid',
  sortBy: 'newest',
  selectedBookmarkId: null,
  selectedIds: new Set(),
  bulkMode: false,
  loaded: false,

  loadAll: async () => {
    const [bookmarks, collections] = await Promise.all([
      loadBookmarks(),
      loadCollections(),
    ]);
    set({ bookmarks, collections, loaded: true });
  },

  addBookmark: async (url, tags = []) => {
    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }

    const normalized = normalizeUrl(finalUrl);
    const existing = get().bookmarks.find((b) => normalizeUrl(b.url) === normalized);
    if (existing) {
      useToastStore.getState().info('Bookmark already exists');
      set({ selectedBookmarkId: existing.id });
      return existing.id;
    }

    const id = uuidv4();
    const now = Date.now();
    const bookmark = {
      id,
      url: finalUrl,
      title: (() => { try { return new URL(finalUrl).hostname; } catch { return finalUrl; } })(),
      description: '',
      favicon: null,
      ogImage: null,
      tags,
      collectionId: null,
      isFavorite: false,
      isArchived: false,
      isRead: false,
      readableContent: null,
      notes: '',
      readingTime: 0,
      source: 'manual',
      feedId: null,
      createdAt: now,
      updatedAt: now,
      _loading: true,
    };
    const bookmarks = [bookmark, ...get().bookmarks];
    set({ bookmarks });
    await saveBookmarks(bookmarks);
    useToastStore.getState().success('Bookmark added');

    fetchMetadata(finalUrl).then(async (meta) => {
      const readingTime = estimateReadingTime(meta.description);
      const updated = get().bookmarks.map((b) =>
        b.id === id
          ? { ...b, ...meta, readingTime, _loading: false, updatedAt: Date.now() }
          : b
      );
      set({ bookmarks: updated });
      await saveBookmarks(updated);
    });

    return id;
  },

  updateBookmark: async (id, changes) => {
    const bookmarks = get().bookmarks.map((b) =>
      b.id === id ? { ...b, ...changes, updatedAt: Date.now() } : b
    );
    set({ bookmarks });
    await saveBookmarks(bookmarks);
  },

  deleteBookmark: async (id) => {
    const bookmark = get().bookmarks.find((b) => b.id === id);
    if (!bookmark) return;

    const confirmed = await useConfirmStore.getState().confirm({
      title: 'Delete bookmark?',
      message: `"${bookmark.title || bookmark.url}" will be removed.`,
      confirmLabel: 'Delete',
      confirmVariant: 'danger',
    });
    if (!confirmed) return;

    const bookmarks = get().bookmarks.filter((b) => b.id !== id);
    const selected = get().selectedIds;
    selected.delete(id);
    set({
      bookmarks,
      selectedBookmarkId: get().selectedBookmarkId === id ? null : get().selectedBookmarkId,
      selectedIds: new Set(selected),
    });
    await saveBookmarks(bookmarks);

    useToastStore.getState().success('Bookmark deleted', {
      undoAction: async () => {
        const restored = [bookmark, ...get().bookmarks];
        set({ bookmarks: restored });
        await saveBookmarks(restored);
        useToastStore.getState().success('Bookmark restored');
      },
    });
  },

  toggleFavorite: async (id) => {
    const bookmark = get().bookmarks.find((b) => b.id === id);
    if (!bookmark) return;
    const wasFavorite = bookmark.isFavorite;
    const bookmarks = get().bookmarks.map((b) =>
      b.id === id ? { ...b, isFavorite: !b.isFavorite, updatedAt: Date.now() } : b
    );
    set({ bookmarks });
    await saveBookmarks(bookmarks);
    useToastStore.getState().success(wasFavorite ? 'Removed from favorites' : 'Added to favorites', {
      undoAction: async () => {
        const reverted = get().bookmarks.map((b) =>
          b.id === id ? { ...b, isFavorite: wasFavorite, updatedAt: Date.now() } : b
        );
        set({ bookmarks: reverted });
        await saveBookmarks(reverted);
      },
    });
  },

  toggleArchive: async (id) => {
    const bookmark = get().bookmarks.find((b) => b.id === id);
    if (!bookmark) return;
    const wasArchived = bookmark.isArchived;
    const bookmarks = get().bookmarks.map((b) =>
      b.id === id ? { ...b, isArchived: !b.isArchived, updatedAt: Date.now() } : b
    );
    set({ bookmarks });
    await saveBookmarks(bookmarks);
    useToastStore.getState().success(wasArchived ? 'Unarchived' : 'Archived', {
      undoAction: async () => {
        const reverted = get().bookmarks.map((b) =>
          b.id === id ? { ...b, isArchived: wasArchived, updatedAt: Date.now() } : b
        );
        set({ bookmarks: reverted });
        await saveBookmarks(reverted);
      },
    });
  },

  toggleRead: async (id) => {
    const bookmarks = get().bookmarks.map((b) =>
      b.id === id ? { ...b, isRead: !b.isRead, updatedAt: Date.now() } : b
    );
    set({ bookmarks });
    await saveBookmarks(bookmarks);
  },

  addTag: async (bookmarkId, tag) => {
    const bookmark = get().bookmarks.find((b) => b.id === bookmarkId);
    if (!bookmark || bookmark.tags.includes(tag)) return;
    const bookmarks = get().bookmarks.map((b) => {
      if (b.id !== bookmarkId) return b;
      return { ...b, tags: [...b.tags, tag], updatedAt: Date.now() };
    });
    set({ bookmarks });
    await saveBookmarks(bookmarks);
    useToastStore.getState().success(`Tag "${tag}" added`, {
      undoAction: async () => {
        const reverted = get().bookmarks.map((b) => {
          if (b.id !== bookmarkId) return b;
          return { ...b, tags: b.tags.filter((t) => t !== tag), updatedAt: Date.now() };
        });
        set({ bookmarks: reverted });
        await saveBookmarks(reverted);
      },
    });
  },

  removeTag: async (bookmarkId, tag) => {
    const bookmark = get().bookmarks.find((b) => b.id === bookmarkId);
    if (!bookmark || !bookmark.tags.includes(tag)) return;
    const bookmarks = get().bookmarks.map((b) => {
      if (b.id !== bookmarkId) return b;
      return { ...b, tags: b.tags.filter((t) => t !== tag), updatedAt: Date.now() };
    });
    set({ bookmarks });
    await saveBookmarks(bookmarks);
    useToastStore.getState().success(`Tag "${tag}" removed`, {
      undoAction: async () => {
        const reverted = get().bookmarks.map((b) => {
          if (b.id !== bookmarkId) return b;
          if (b.tags.includes(tag)) return b;
          return { ...b, tags: [...b.tags, tag], updatedAt: Date.now() };
        });
        set({ bookmarks: reverted });
        await saveBookmarks(reverted);
      },
    });
  },

  setActiveView: (view) => set({ activeView: view, selectedBookmarkId: null, bulkMode: false, selectedIds: new Set() }),
  setSearchQuery: (query) => {
    if (query) {
      set({ searchQuery: query, activeView: 'search' });
    } else {
      const { activeView } = get();
      set({ searchQuery: '', activeView: activeView === 'search' ? 'inbox' : activeView });
    }
  },
  setViewMode: (mode) => set({ viewMode: mode }),
  setSortBy: (sortBy) => set({ sortBy }),
  setSelectedBookmark: (id) => set({ selectedBookmarkId: id }),

  // Bulk actions
  toggleBulkMode: () => {
    const bulkMode = !get().bulkMode;
    set({ bulkMode, selectedIds: bulkMode ? get().selectedIds : new Set() });
  },

  toggleSelected: (id) => {
    const selected = new Set(get().selectedIds);
    if (selected.has(id)) {
      selected.delete(id);
    } else {
      selected.add(id);
    }
    set({ selectedIds: selected });
  },

  selectAll: () => {
    const filtered = get().getFilteredBookmarks();
    set({ selectedIds: new Set(filtered.map((b) => b.id)) });
  },

  deselectAll: () => set({ selectedIds: new Set() }),

  bulkDelete: async () => {
    const ids = get().selectedIds;
    if (ids.size === 0) return;

    const confirmed = await useConfirmStore.getState().confirm({
      title: `Delete ${ids.size} bookmark${ids.size > 1 ? 's' : ''}?`,
      message: 'This will remove the selected bookmarks.',
      confirmLabel: 'Delete',
      confirmVariant: 'danger',
    });
    if (!confirmed) return;

    const deletedBookmarks = get().bookmarks.filter((b) => ids.has(b.id));
    const bookmarks = get().bookmarks.filter((b) => !ids.has(b.id));
    set({ bookmarks, selectedIds: new Set(), bulkMode: false });
    await saveBookmarks(bookmarks);
    useToastStore.getState().success(`Deleted ${deletedBookmarks.length} bookmarks`, {
      undoAction: async () => {
        const restored = [...deletedBookmarks, ...get().bookmarks];
        set({ bookmarks: restored });
        await saveBookmarks(restored);
        useToastStore.getState().success('Bookmarks restored');
      },
    });
  },

  bulkArchive: async () => {
    const ids = get().selectedIds;
    if (ids.size === 0) return;
    const prevStates = new Map();
    get().bookmarks.forEach((b) => {
      if (ids.has(b.id)) prevStates.set(b.id, b.isArchived);
    });
    const bookmarks = get().bookmarks.map((b) =>
      ids.has(b.id) ? { ...b, isArchived: true, updatedAt: Date.now() } : b
    );
    const count = ids.size;
    set({ bookmarks, selectedIds: new Set(), bulkMode: false });
    await saveBookmarks(bookmarks);
    useToastStore.getState().success(`Archived ${count} bookmarks`, {
      undoAction: async () => {
        const reverted = get().bookmarks.map((b) => {
          if (!prevStates.has(b.id)) return b;
          return { ...b, isArchived: prevStates.get(b.id), updatedAt: Date.now() };
        });
        set({ bookmarks: reverted });
        await saveBookmarks(reverted);
        useToastStore.getState().success(`Unarchived ${count} bookmarks`);
      },
    });
  },

  bulkTag: async (tag) => {
    const ids = get().selectedIds;
    if (ids.size === 0) return;
    const alreadyTagged = new Set();
    get().bookmarks.forEach((b) => {
      if (ids.has(b.id) && b.tags.includes(tag)) alreadyTagged.add(b.id);
    });
    const bookmarks = get().bookmarks.map((b) => {
      if (!ids.has(b.id)) return b;
      if (b.tags.includes(tag)) return b;
      return { ...b, tags: [...b.tags, tag], updatedAt: Date.now() };
    });
    const count = ids.size;
    set({ bookmarks, selectedIds: new Set(), bulkMode: false });
    await saveBookmarks(bookmarks);
    useToastStore.getState().success(`Tagged ${count} bookmarks with "${tag}"`, {
      undoAction: async () => {
        const reverted = get().bookmarks.map((b) => {
          if (!ids.has(b.id) || alreadyTagged.has(b.id)) return b;
          return { ...b, tags: b.tags.filter((t) => t !== tag), updatedAt: Date.now() };
        });
        set({ bookmarks: reverted });
        await saveBookmarks(reverted);
        useToastStore.getState().success(`Removed tag "${tag}" from ${count} bookmarks`);
      },
    });
  },

  bulkMoveToCollection: async (collectionId) => {
    const ids = get().selectedIds;
    if (ids.size === 0) return;
    const prevCollections = new Map();
    get().bookmarks.forEach((b) => {
      if (ids.has(b.id)) prevCollections.set(b.id, b.collectionId);
    });
    const bookmarks = get().bookmarks.map((b) =>
      ids.has(b.id) ? { ...b, collectionId, updatedAt: Date.now() } : b
    );
    const count = ids.size;
    set({ bookmarks, selectedIds: new Set(), bulkMode: false });
    await saveBookmarks(bookmarks);
    const col = get().collections.find((c) => c.id === collectionId);
    useToastStore.getState().success(`Moved ${count} bookmarks to "${col?.name || 'collection'}"`, {
      undoAction: async () => {
        const reverted = get().bookmarks.map((b) => {
          if (!prevCollections.has(b.id)) return b;
          return { ...b, collectionId: prevCollections.get(b.id), updatedAt: Date.now() };
        });
        set({ bookmarks: reverted });
        await saveBookmarks(reverted);
        useToastStore.getState().success(`Moved ${count} bookmarks back`);
      },
    });
  },

  // Collections
  createCollection: async (name) => {
    const collection = {
      id: uuidv4(),
      name,
      icon: 'FolderOpen',
      createdAt: Date.now(),
    };
    const collections = [...get().collections, collection];
    set({ collections });
    await saveCollections(collections);
    useToastStore.getState().success(`Collection "${name}" created`);
    return collection;
  },

  updateCollection: async (id, changes) => {
    const collections = get().collections.map((c) =>
      c.id === id ? { ...c, ...changes } : c
    );
    set({ collections });
    await saveCollections(collections);
  },

  deleteCollection: async (id) => {
    const col = get().collections.find((c) => c.id === id);
    const affectedBookmarks = get().bookmarks.filter((b) => b.collectionId === id);
    const affectedIds = new Set(affectedBookmarks.map((b) => b.id));
    const collections = get().collections.filter((c) => c.id !== id);
    const bookmarks = get().bookmarks.map((b) =>
      b.collectionId === id ? { ...b, collectionId: null, updatedAt: Date.now() } : b
    );
    set({ collections, bookmarks });
    await Promise.all([saveCollections(collections), saveBookmarks(bookmarks)]);
    if (col) {
      useToastStore.getState().success(`Collection "${col.name}" deleted`, {
        undoAction: async () => {
          const restoredCollections = [...get().collections, col];
          const restoredBookmarks = get().bookmarks.map((b) =>
            affectedIds.has(b.id) ? { ...b, collectionId: id, updatedAt: Date.now() } : b
          );
          set({ collections: restoredCollections, bookmarks: restoredBookmarks });
          await Promise.all([saveCollections(restoredCollections), saveBookmarks(restoredBookmarks)]);
          useToastStore.getState().success(`Collection "${col.name}" restored`);
        },
      });
    }
  },

  moveToCollection: async (bookmarkId, collectionId) => {
    const bookmark = get().bookmarks.find((b) => b.id === bookmarkId);
    if (!bookmark) return;
    const prevCollectionId = bookmark.collectionId;
    const bookmarks = get().bookmarks.map((b) =>
      b.id === bookmarkId ? { ...b, collectionId, updatedAt: Date.now() } : b
    );
    set({ bookmarks });
    await saveBookmarks(bookmarks);
    const col = get().collections.find((c) => c.id === collectionId);
    useToastStore.getState().success(collectionId ? `Moved to "${col?.name || 'collection'}"` : 'Removed from collection', {
      undoAction: async () => {
        const reverted = get().bookmarks.map((b) =>
          b.id === bookmarkId ? { ...b, collectionId: prevCollectionId, updatedAt: Date.now() } : b
        );
        set({ bookmarks: reverted });
        await saveBookmarks(reverted);
      },
    });
  },

  // Drag-and-drop: reorder bookmarks in the master list
  reorderBookmarks: async (activeId, overId) => {
    const bookmarks = [...get().bookmarks];
    const oldIndex = bookmarks.findIndex((b) => b.id === activeId);
    const newIndex = bookmarks.findIndex((b) => b.id === overId);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
    const [moved] = bookmarks.splice(oldIndex, 1);
    bookmarks.splice(newIndex, 0, moved);
    set({ bookmarks, sortBy: 'manual' });
    await saveBookmarks(bookmarks);
  },

  // Drag-and-drop: move bookmark to a collection by dropping
  dragToCollection: async (bookmarkId, collectionId) => {
    const bookmark = get().bookmarks.find((b) => b.id === bookmarkId);
    if (!bookmark || bookmark.collectionId === collectionId) return;
    const prevCollectionId = bookmark.collectionId;
    const bookmarks = get().bookmarks.map((b) =>
      b.id === bookmarkId ? { ...b, collectionId, updatedAt: Date.now() } : b
    );
    set({ bookmarks });
    await saveBookmarks(bookmarks);
    const col = get().collections.find((c) => c.id === collectionId);
    useToastStore.getState().success(`Moved to "${col?.name || 'collection'}"`, {
      undoAction: async () => {
        const reverted = get().bookmarks.map((b) =>
          b.id === bookmarkId ? { ...b, collectionId: prevCollectionId, updatedAt: Date.now() } : b
        );
        set({ bookmarks: reverted });
        await saveBookmarks(reverted);
      },
    });
  },

  // Drag-and-drop: tag a bookmark by dropping onto a tag
  dragToTag: async (bookmarkId, tagName) => {
    const bookmark = get().bookmarks.find((b) => b.id === bookmarkId);
    if (!bookmark || bookmark.tags.includes(tagName)) return;
    const bookmarks = get().bookmarks.map((b) => {
      if (b.id !== bookmarkId) return b;
      return { ...b, tags: [...b.tags, tagName], updatedAt: Date.now() };
    });
    set({ bookmarks });
    await saveBookmarks(bookmarks);
    useToastStore.getState().success(`Tagged with "${tagName}"`, {
      undoAction: async () => {
        const reverted = get().bookmarks.map((b) => {
          if (b.id !== bookmarkId) return b;
          return { ...b, tags: b.tags.filter((t) => t !== tagName), updatedAt: Date.now() };
        });
        set({ bookmarks: reverted });
        await saveBookmarks(reverted);
      },
    });
  },

  // Drag-and-drop: archive / favorite by dropping on nav items
  dragToView: async (bookmarkId, viewId) => {
    const bookmark = get().bookmarks.find((b) => b.id === bookmarkId);
    if (!bookmark) return;
    let changes = {};
    if (viewId === 'favorites' && !bookmark.isFavorite) changes = { isFavorite: true };
    else if (viewId === 'archive' && !bookmark.isArchived) changes = { isArchived: true };
    else return;
    const prevState = { isFavorite: bookmark.isFavorite, isArchived: bookmark.isArchived };
    const bookmarks = get().bookmarks.map((b) =>
      b.id === bookmarkId ? { ...b, ...changes, updatedAt: Date.now() } : b
    );
    set({ bookmarks });
    await saveBookmarks(bookmarks);
    useToastStore.getState().success(viewId === 'favorites' ? 'Added to favorites' : 'Archived', {
      undoAction: async () => {
        const reverted = get().bookmarks.map((b) =>
          b.id === bookmarkId ? { ...b, ...prevState, updatedAt: Date.now() } : b
        );
        set({ bookmarks: reverted });
        await saveBookmarks(reverted);
      },
    });
  },

  // Import
  importBookmarksData: async (newBookmarks) => {
    const bookmarks = [...get().bookmarks, ...newBookmarks];
    set({ bookmarks });
    await saveBookmarks(bookmarks);
  },

  // Deduplication
  findDuplicates: () => {
    const { bookmarks } = get();
    const groups = {};
    bookmarks.forEach((b) => {
      const key = normalizeUrl(b.url);
      if (!groups[key]) groups[key] = [];
      groups[key].push(b);
    });
    return Object.values(groups)
      .filter((g) => g.length > 1)
      .sort((a, b) => b.length - a.length);
  },

  mergeDuplicates: async (keepId, removeIds) => {
    const allBookmarks = get().bookmarks;
    const keep = allBookmarks.find((b) => b.id === keepId);
    if (!keep) return;
    const toRemove = allBookmarks.filter((b) => removeIds.includes(b.id));
    if (toRemove.length === 0) return;

    // Merge: union tags, prefer first non-empty notes, keep isFavorite if any, keep earliest createdAt
    const mergedTags = [...new Set([...keep.tags, ...toRemove.flatMap((b) => b.tags || [])])];
    const mergedNotes = keep.notes || toRemove.find((b) => b.notes)?.notes || '';
    const mergedFavorite = keep.isFavorite || toRemove.some((b) => b.isFavorite);
    const mergedDescription = keep.description || toRemove.find((b) => b.description)?.description || '';
    const mergedReadable = keep.readableContent || toRemove.find((b) => b.readableContent)?.readableContent || null;
    const mergedCreated = Math.min(keep.createdAt, ...toRemove.map((b) => b.createdAt));
    const mergedCollectionId = keep.collectionId || toRemove.find((b) => b.collectionId)?.collectionId || null;

    const removeSet = new Set(removeIds);
    const bookmarks = allBookmarks
      .filter((b) => !removeSet.has(b.id))
      .map((b) =>
        b.id === keepId
          ? {
              ...b,
              tags: mergedTags,
              notes: mergedNotes,
              isFavorite: mergedFavorite,
              description: mergedDescription,
              readableContent: mergedReadable,
              createdAt: mergedCreated,
              collectionId: mergedCollectionId,
              updatedAt: Date.now(),
            }
          : b
      );

    set({ bookmarks });
    await saveBookmarks(bookmarks);
    useToastStore.getState().success(`Merged ${toRemove.length + 1} duplicates into one`, {
      undoAction: async () => {
        // Restore all the originals (including the removed ones)
        const originals = [keep, ...toRemove];
        const remaining = get().bookmarks.filter((b) => b.id !== keepId);
        const restored = [...originals, ...remaining];
        set({ bookmarks: restored });
        await saveBookmarks(restored);
        useToastStore.getState().success('Merge undone');
      },
    });
  },

  // Computed
  getFilteredBookmarks: () => {
    const { bookmarks, activeView, searchQuery, sortBy } = get();

    let filtered;
    if (activeView === 'inbox') {
      filtered = bookmarks.filter((b) => !b.isArchived && !b.isRead && b.source === 'manual');
    } else if (activeView === 'all') {
      filtered = bookmarks.filter((b) => !b.isArchived && b.source !== 'feed');
    } else if (activeView === 'favorites') {
      filtered = bookmarks.filter((b) => b.isFavorite && b.source !== 'feed');
    } else if (activeView === 'archive') {
      filtered = bookmarks.filter((b) => b.isArchived && b.source !== 'feed');
    } else if (activeView.startsWith('tag:')) {
      const tagName = activeView.slice(4);
      filtered = bookmarks.filter((b) => b.tags.includes(tagName));
    } else if (activeView.startsWith('collection:')) {
      const colId = activeView.slice(11);
      filtered = bookmarks.filter((b) => b.collectionId === colId);
    } else if (activeView.startsWith('feed:')) {
      const feedId = activeView.slice(5);
      filtered = bookmarks.filter((b) => b.feedId === feedId);
    } else if (activeView === 'search') {
      filtered = searchBookmarks(bookmarks, searchQuery);
    } else {
      filtered = bookmarks;
    }

    // When searching, preserve Fuse.js relevance order; otherwise apply user sort.
    return activeView === 'search' ? filtered : sortBookmarks(filtered, sortBy);
  },

  getAllTags: () => {
    const { bookmarks } = get();
    const tagMap = {};
    bookmarks.forEach((b) => {
      (b.tags || []).forEach((t) => {
        tagMap[t] = (tagMap[t] || 0) + 1;
      });
    });
    return Object.entries(tagMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  },

  getStats: () => {
    const { bookmarks, collections, feeds } = get();
    return {
      total: bookmarks.length,
      unread: bookmarks.filter((b) => !b.isRead && !b.isArchived).length,
      favorites: bookmarks.filter((b) => b.isFavorite).length,
      archived: bookmarks.filter((b) => b.isArchived).length,
      tags: new Set(bookmarks.flatMap((b) => b.tags || [])).size,
      collections: collections?.length || 0,
      fromFeeds: bookmarks.filter((b) => b.source === 'feed').length,
    };
  },
}));

function sortBookmarks(bookmarks, sortBy) {
  if (sortBy === 'manual') return bookmarks; // user-defined order, no sorting
  const sorted = [...bookmarks];
  switch (sortBy) {
    case 'newest':
      return sorted.sort((a, b) => b.createdAt - a.createdAt);
    case 'oldest':
      return sorted.sort((a, b) => a.createdAt - b.createdAt);
    case 'title-asc':
      return sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    case 'title-desc':
      return sorted.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
    case 'domain':
      return sorted.sort((a, b) => {
        try {
          return new URL(a.url).hostname.localeCompare(new URL(b.url).hostname);
        } catch {
          return 0;
        }
      });
    default:
      return sorted.sort((a, b) => b.createdAt - a.createdAt);
  }
}

// ── Memoized selector hooks ──────────────────────────────────────────────────
// These use React.useMemo tied to the specific store slices so that
// consumers only recompute when the underlying data actually changes.

/**
 * Returns the filtered + sorted bookmark list, memoised on the values
 * that feed into getFilteredBookmarks().
 */
export function useFilteredBookmarks() {
  const bookmarks = useBookmarkStore((s) => s.bookmarks);
  const activeView = useBookmarkStore((s) => s.activeView);
  const searchQuery = useBookmarkStore((s) => s.searchQuery);
  const sortBy = useBookmarkStore((s) => s.sortBy);
  const getFilteredBookmarks = useBookmarkStore((s) => s.getFilteredBookmarks);

  return useMemo(
    () => getFilteredBookmarks(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bookmarks, activeView, searchQuery, sortBy]
  );
}

/**
 * Returns the aggregated tag list, memoised on the bookmarks array ref.
 */
export function useAllTags() {
  const bookmarks = useBookmarkStore((s) => s.bookmarks);
  const getAllTags = useBookmarkStore((s) => s.getAllTags);

  return useMemo(
    () => getAllTags(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bookmarks]
  );
}

/**
 * Returns the inbox count, memoised on the bookmarks array ref.
 */
export function useInboxCount() {
  const bookmarks = useBookmarkStore((s) => s.bookmarks);

  return useMemo(
    () => bookmarks.filter((b) => !b.isArchived && !b.isRead && b.source === 'manual').length,
    [bookmarks]
  );
}
