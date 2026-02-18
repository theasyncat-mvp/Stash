import { useBookmarkStore, useFilteredBookmarks } from '../store/useBookmarkStore.js';
import BookmarkCard from './BookmarkCard.jsx';
import BookmarkRow from './BookmarkRow.jsx';
import EmptyState from './EmptyState.jsx';

export default function BookmarkList() {
  const { viewMode, activeView } = useBookmarkStore();
  const bookmarks = useFilteredBookmarks();

  if (bookmarks.length === 0) {
    return <EmptyState view={activeView} />;
  }

  if (viewMode === 'list') {
    return (
      <div className="flex flex-col gap-1">
        {bookmarks.map((bookmark) => (
          <BookmarkRow key={bookmark.id} bookmark={bookmark} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {bookmarks.map((bookmark) => (
        <BookmarkCard key={bookmark.id} bookmark={bookmark} />
      ))}
    </div>
  );
}
