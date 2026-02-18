import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
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

  // Determine columns for grid view based on container width
  // We reuse the same Tailwind breakpoints: 1 col < 640, 2 cols < 1024, 3 cols
  const getColumns = () => {
    if (!parentRef.current) return 3;
    const w = parentRef.current.offsetWidth;
    if (w < 640) return 1;
    if (w < 1024) return 2;
    return 3;
  };

  if (bookmarks.length === 0) {
    return <EmptyState view={activeView} />;
  }

  if (viewMode === 'list') {
    return <VirtualList bookmarks={bookmarks} parentRef={parentRef} />;
  }

  return <VirtualGrid bookmarks={bookmarks} parentRef={parentRef} getColumns={getColumns} />;
}

function VirtualList({ bookmarks, parentRef }) {
  const virtualizer = useVirtualizer({
    count: bookmarks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
  });

  return (
    <div ref={parentRef} className="h-full overflow-y-auto" role="list" aria-label="Bookmarks list">
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
            <BookmarkRow bookmark={bookmarks[vItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}

function VirtualGrid({ bookmarks, parentRef, getColumns }) {
  const cols = typeof getColumns === 'function' ? getColumns() : 3;
  const rowCount = Math.ceil(bookmarks.length / cols);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => CARD_ROW_HEIGHT,
    overscan: OVERSCAN,
  });

  return (
    <div ref={parentRef} className="h-full overflow-y-auto" role="list" aria-label="Bookmarks grid">
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map((vRow) => {
          const startIdx = vRow.index * cols;
          const rowBookmarks = bookmarks.slice(startIdx, startIdx + cols);
          return (
            <div
              key={vRow.index}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              role="listitem"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${vRow.start}px)`,
              }}
            >
              {rowBookmarks.map((bm) => (
                <BookmarkCard key={bm.id} bookmark={bm} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
