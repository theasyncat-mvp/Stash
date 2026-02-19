import { useRef, useState, useCallback, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { SortableContext, verticalListSortingStrategy, rectSortingStrategy } from '@dnd-kit/sortable';
import { open as shellOpen } from '@tauri-apps/plugin-shell';
import { useBookmarkStore, useFilteredBookmarks } from '../store/useBookmarkStore.js';
import BookmarkCard from './BookmarkCard.jsx';
import BookmarkRow from './BookmarkRow.jsx';
import EmptyState from './EmptyState.jsx';

const ROW_HEIGHT = 52;       // px – matches BookmarkRow's real height
const CARD_ROW_HEIGHT = 320; // px – approximate card row height
const OVERSCAN = 6;

export default function BookmarkList() {
  const { viewMode, activeView } = useBookmarkStore();
  const bookmarks = useFilteredBookmarks();
  const parentRef = useRef(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Reset focus when bookmarks change
  useEffect(() => {
    setFocusedIndex(-1);
  }, [bookmarks.length, activeView]);

  // Determine columns for grid view based on container width
  const getColumns = () => {
    if (!parentRef.current) return 3;
    const w = parentRef.current.offsetWidth;
    if (w < 480) return 1;
    if (w < 640) return 2;
    return 3;
  };

  if (bookmarks.length === 0) {
    return <EmptyState view={activeView} />;
  }

  if (viewMode === 'list') {
    return (
      <VirtualList
        bookmarks={bookmarks}
        parentRef={parentRef}
        focusedIndex={focusedIndex}
        setFocusedIndex={setFocusedIndex}
      />
    );
  }

  return (
    <VirtualGrid
      bookmarks={bookmarks}
      parentRef={parentRef}
      getColumns={getColumns}
      focusedIndex={focusedIndex}
      setFocusedIndex={setFocusedIndex}
    />
  );
}

function VirtualList({ bookmarks, parentRef, focusedIndex, setFocusedIndex }) {
  const { setSelectedBookmark } = useBookmarkStore();
  const ids = bookmarks.map((b) => b.id);
  const virtualizer = useVirtualizer({
    count: bookmarks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
  });

  const handleKeyDown = useCallback(
    (e) => {
      // Skip if user is in an input / textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const len = bookmarks.length;
      if (len === 0) return;

      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        setFocusedIndex((i) => {
          const next = i < len - 1 ? i + 1 : i;
          virtualizer.scrollToIndex(next, { align: 'auto' });
          return next;
        });
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        setFocusedIndex((i) => {
          const next = i > 0 ? i - 1 : 0;
          virtualizer.scrollToIndex(next, { align: 'auto' });
          return next;
        });
      } else if (e.key === 'Enter' && focusedIndex >= 0 && focusedIndex < len) {
        e.preventDefault();
        setSelectedBookmark(bookmarks[focusedIndex].id);
      } else if (e.key === 'o' && focusedIndex >= 0 && focusedIndex < len) {
        e.preventDefault();
        shellOpen(bookmarks[focusedIndex].url);
      }
    },
    [bookmarks, focusedIndex, setFocusedIndex, setSelectedBookmark, virtualizer],
  );

  return (
    <div
      ref={parentRef}
      className="h-full overflow-y-auto outline-none"
      role="list"
      aria-label="Bookmarks list"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-1" style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
          {virtualizer.getVirtualItems().map((vItem) => (
            <div
              key={bookmarks[vItem.index].id}
              role="listitem"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${vItem.start}px)`,
              }}
            >
              <BookmarkRow bookmark={bookmarks[vItem.index]} isFocused={vItem.index === focusedIndex} />
            </div>
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

function VirtualGrid({ bookmarks, parentRef, getColumns, focusedIndex, setFocusedIndex }) {
  const { setSelectedBookmark } = useBookmarkStore();
  const cols = typeof getColumns === 'function' ? getColumns() : 3;
  const rowCount = Math.ceil(bookmarks.length / cols);
  const ids = bookmarks.map((b) => b.id);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => CARD_ROW_HEIGHT,
    overscan: OVERSCAN,
  });

  const handleKeyDown = useCallback(
    (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const len = bookmarks.length;
      if (len === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((i) => {
          const next = Math.min(i + cols, len - 1);
          virtualizer.scrollToIndex(Math.floor(next / cols), { align: 'auto' });
          return next;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((i) => {
          const next = Math.max(i - cols, 0);
          virtualizer.scrollToIndex(Math.floor(next / cols), { align: 'auto' });
          return next;
        });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setFocusedIndex((i) => {
          const next = i < len - 1 ? i + 1 : i;
          virtualizer.scrollToIndex(Math.floor(next / cols), { align: 'auto' });
          return next;
        });
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setFocusedIndex((i) => {
          const next = i > 0 ? i - 1 : 0;
          virtualizer.scrollToIndex(Math.floor(next / cols), { align: 'auto' });
          return next;
        });
      } else if (e.key === 'Enter' && focusedIndex >= 0 && focusedIndex < len) {
        e.preventDefault();
        setSelectedBookmark(bookmarks[focusedIndex].id);
      } else if (e.key === 'o' && focusedIndex >= 0 && focusedIndex < len) {
        e.preventDefault();
        shellOpen(bookmarks[focusedIndex].url);
      }
    },
    [bookmarks, cols, focusedIndex, setFocusedIndex, setSelectedBookmark, virtualizer],
  );

  return (
    <div
      ref={parentRef}
      className="h-full overflow-y-auto outline-none"
      role="list"
      aria-label="Bookmarks grid"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
          {virtualizer.getVirtualItems().map((vRow) => {
            const startIdx = vRow.index * cols;
            const rowBookmarks = bookmarks.slice(startIdx, startIdx + cols);
            return (
              <div
                key={vRow.index}
                role="listitem"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${vRow.start}px)`,
                  display: 'grid',
                  gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                  gap: '1rem',
                }}
              >
                {rowBookmarks.map((bm, i) => (
                  <BookmarkCard key={bm.id} bookmark={bm} isFocused={startIdx + i === focusedIndex} />
                ))}
              </div>
            );
          })}
        </div>
      </SortableContext>
    </div>
  );
}
