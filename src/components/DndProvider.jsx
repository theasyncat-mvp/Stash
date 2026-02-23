import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { useBookmarkStore } from '../store/useBookmarkStore.js';
import { useVaultStore } from '../store/useVaultStore.js';

/**
 * Top-level drag & drop provider.
 *
 * Bookmark items carry  `data: { type: 'bookmark', bookmark }`.
 * Vault items carry     `data: { type: 'vault-bookmark', bookmark }`.
 * Drop targets carry    `data: { type: 'collection'|'tag'|'nav', id }`.
 *
 * - Dropping on a sortable sibling → reorder  (handled by BookmarkList / VaultView)
 * - Dropping on a sidebar target   → move to collection / tag / archive / favorite
 *   (vault bookmarks are NOT allowed to drop on sidebar targets)
 */
export default function DndProvider({ children }) {
  const [activeBookmark, setActiveBookmark] = useState(null);
  const { reorderBookmarks, dragToCollection, dragToTag, dragToView } = useBookmarkStore();

  // Require a 5px drag before activating so normal clicks still work
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragStart = useCallback((event) => {
    const { active } = event;
    const type = active.data.current?.type;
    if (type === 'bookmark' || type === 'vault-bookmark') {
      setActiveBookmark(active.data.current.bookmark);
    }
  }, []);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    setActiveBookmark(null);
    if (!over || !active.data.current) return;

    // Vault bookmarks: only allow reordering within the vault list
    if (active.data.current.type === 'vault-bookmark') {
      if (over.data.current?.type === 'vault-bookmark' && active.id !== over.id) {
        useVaultStore.getState().reorderBookmarks(active.id, over.id);
        useVaultStore.getState().setSortBy('manual');
      }
      return;
    }

    const bookmarkId = active.id;
    const overData = over.data.current;

    if (!overData) {
      // Dropped on another sortable bookmark → reorder
      if (active.id !== over.id) {
        reorderBookmarks(active.id, over.id);
      }
      return;
    }

    if (overData.type === 'collection') {
      dragToCollection(bookmarkId, overData.id);
    } else if (overData.type === 'tag') {
      dragToTag(bookmarkId, overData.id);
    } else if (overData.type === 'nav') {
      dragToView(bookmarkId, overData.id);
    } else if (overData.type === 'bookmark' && active.id !== over.id) {
      reorderBookmarks(active.id, over.id);
    }
  }, [reorderBookmarks, dragToCollection, dragToTag, dragToView]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {children}
      <DragOverlay dropAnimation={null}>
        {activeBookmark ? (
          <div className="px-4 py-2 bg-white dark:bg-zinc-900 border border-blue-500 rounded-lg shadow-xl text-sm text-zinc-900 dark:text-zinc-100 truncate max-w-xs opacity-90">
            {activeBookmark.title || activeBookmark.url}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
