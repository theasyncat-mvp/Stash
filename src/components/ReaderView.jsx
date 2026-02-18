import { useState, useEffect } from 'react';
import { ArrowLeft, Star, ExternalLink } from 'lucide-react';
import { useBookmarkStore } from '../store/useBookmarkStore.js';
import { useReaderStore, READER_FONTS } from '../store/useReaderStore.js';
import { fetchReadableContent } from '../lib/reader.js';
import ReaderPreferences from './ReaderPreferences.jsx';

export default function ReaderView({ bookmark, onClose }) {
  const { toggleFavorite, updateBookmark } = useBookmarkStore();
  const { fontSize, fontFamily, lineHeight, maxWidth, loaded, init } = useReaderStore();
  const [content, setContent] = useState(bookmark.readableContent);
  const [loading, setLoading] = useState(!bookmark.readableContent);

  useEffect(() => {
    if (!loaded) init();
  }, [loaded, init]);

  useEffect(() => {
    if (!bookmark.readableContent) {
      setLoading(true);
      fetchReadableContent(bookmark.url).then((html) => {
        setContent(html);
        setLoading(false);
        if (html) {
          updateBookmark(bookmark.id, { readableContent: html });
        }
      });
    }
  }, [bookmark.id, bookmark.url, bookmark.readableContent, updateBookmark]);

  const contentStyle = {
    fontFamily: READER_FONTS[fontFamily] || READER_FONTS.serif,
    fontSize: `${fontSize}px`,
    lineHeight,
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#FAFAFA] dark:bg-zinc-950 overflow-y-auto">
      <div className="sticky top-0 bg-[#FAFAFA]/80 dark:bg-zinc-950/80 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800 z-10">
        <div className="mx-auto px-6 py-3 flex items-center gap-3" style={{ maxWidth: `${maxWidth}px` }}>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors duration-150 cursor-pointer text-zinc-600 dark:text-zinc-400"
          >
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate flex-1">
            {bookmark.title}
          </h1>
          <ReaderPreferences />
          <button
            onClick={() => toggleFavorite(bookmark.id)}
            className={`p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-150 cursor-pointer ${bookmark.isFavorite ? 'text-yellow-500' : 'text-zinc-400'}`}
          >
            <Star size={16} fill={bookmark.isFavorite ? 'currentColor' : 'none'} />
          </button>
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors duration-150"
          >
            <ExternalLink size={16} />
          </a>
        </div>
      </div>
      <div className="mx-auto px-6 py-12" style={{ maxWidth: `${maxWidth}px` }}>
        {loading ? (
          <div className="space-y-4">
            <div className="w-3/4 h-8 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
            <div className="w-full h-4 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
            <div className="w-full h-4 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
            <div className="w-2/3 h-4 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
          </div>
        ) : content ? (
          <div className="reader-content" style={contentStyle} dangerouslySetInnerHTML={{ __html: content }} />
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-zinc-400 dark:text-zinc-500">Could not extract readable content from this page.</p>
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-500 hover:text-blue-600 mt-2 inline-block"
            >
              Open original page
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
