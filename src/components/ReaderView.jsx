import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Star, ExternalLink, Clock, Globe, BookOpen, ChevronUp } from 'lucide-react';
import { open as shellOpen } from '@tauri-apps/plugin-shell';
import { useBookmarkStore } from '../store/useBookmarkStore.js';
import { useReaderStore, READER_FONTS } from '../store/useReaderStore.js';
import { fetchReadableContent } from '../lib/reader.js';
import { timeAgo } from '../lib/timeAgo.js';
import ReaderPreferences from './ReaderPreferences.jsx';

export default function ReaderView({ bookmark, onClose }) {
  const { toggleFavorite, toggleRead, updateBookmark } = useBookmarkStore();
  const { fontSize, fontFamily, lineHeight, maxWidth, loaded, init } = useReaderStore();
  const [content, setContent] = useState(bookmark.readableContent);
  const [loading, setLoading] = useState(!bookmark.readableContent);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [progress, setProgress] = useState(0);
  const scrollRef = useRef(null);

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

  // Mark as read after 3 seconds of reading
  useEffect(() => {
    if (!bookmark.isRead && content) {
      const timeout = setTimeout(() => {
        toggleRead(bookmark.id);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [bookmark.id, bookmark.isRead, content, toggleRead]);

  // Scroll progress + back-to-top button
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const pct = scrollHeight > clientHeight ? scrollTop / (scrollHeight - clientHeight) : 0;
      setProgress(Math.min(pct, 1));
      setShowScrollTop(scrollTop > 400);
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const domain = (() => {
    try { return new URL(bookmark.url).hostname.replace('www.', ''); }
    catch { return bookmark.url; }
  })();

  const contentStyle = {
    fontFamily: READER_FONTS[fontFamily] || READER_FONTS.serif,
    fontSize: `${fontSize}px`,
    lineHeight,
  };

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-zinc-950 flex flex-col">
      {/* Reading progress bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 z-20">
        <div
          className="h-full bg-blue-500 transition-[width] duration-150 ease-out"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Toolbar */}
      <div className="sticky top-0 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-800/60 z-10">
        <div className="mx-auto px-6 py-2.5 flex items-center gap-2" style={{ maxWidth: `${maxWidth + 200}px` }}>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors duration-150 cursor-pointer text-zinc-500 dark:text-zinc-400"
            aria-label="Close reader"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="flex-1 min-w-0 mx-2">
            <p className="text-xs text-zinc-900 dark:text-zinc-100 font-medium truncate">{bookmark.title}</p>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">{domain}</p>
          </div>

          <ReaderPreferences />

          <button
            onClick={() => toggleFavorite(bookmark.id)}
            className={`p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-150 cursor-pointer ${bookmark.isFavorite ? 'text-yellow-500' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
            aria-label={bookmark.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star size={16} fill={bookmark.isFavorite ? 'currentColor' : 'none'} />
          </button>

          <button
            onClick={() => shellOpen(bookmark.url)}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors duration-150 cursor-pointer"
            aria-label="Open in browser"
          >
            <ExternalLink size={16} />
          </button>
        </div>
      </div>

      {/* Scrollable content area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto px-6" style={{ maxWidth: `${maxWidth}px` }}>

          {loading ? (
            <div className="py-16 space-y-6 animate-pulse">
              <div className="space-y-3">
                <div className="w-1/4 h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
                <div className="w-4/5 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
                <div className="w-2/3 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
              </div>
              <div className="w-1/3 h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
              <div className="w-full h-64 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
              <div className="space-y-3">
                <div className="w-full h-4 bg-zinc-100 dark:bg-zinc-800 rounded" />
                <div className="w-full h-4 bg-zinc-100 dark:bg-zinc-800 rounded" />
                <div className="w-5/6 h-4 bg-zinc-100 dark:bg-zinc-800 rounded" />
                <div className="w-full h-4 bg-zinc-100 dark:bg-zinc-800 rounded" />
                <div className="w-2/3 h-4 bg-zinc-100 dark:bg-zinc-800 rounded" />
              </div>
            </div>
          ) : content ? (
            <>
              {/* Article header */}
              <header className="pt-12 pb-8 border-b border-zinc-100 dark:border-zinc-800/50 mb-8">
                {/* Domain & meta */}
                <div className="flex items-center gap-2 mb-4">
                  {bookmark.favicon ? (
                    <img src={bookmark.favicon} alt="" className="w-4 h-4 rounded-sm" onError={(e) => { e.target.style.display = 'none'; }} />
                  ) : (
                    <Globe size={14} className="text-zinc-400" />
                  )}
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{domain}</span>
                </div>

                {/* Title */}
                <h1
                  className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 leading-tight mb-4"
                  style={{ fontFamily: READER_FONTS[fontFamily] || READER_FONTS.serif }}
                >
                  {bookmark.title}
                </h1>

                {/* Description */}
                {bookmark.description && (
                  <p className="text-base text-zinc-500 dark:text-zinc-400 leading-relaxed mb-5" style={{ fontFamily: READER_FONTS[fontFamily] || READER_FONTS.serif }}>
                    {bookmark.description}
                  </p>
                )}

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 dark:text-zinc-500">
                  {bookmark.readingTime > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {bookmark.readingTime} min read
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <BookOpen size={12} />
                    {timeAgo(bookmark.createdAt)}
                  </span>
                  {bookmark.tags?.length > 0 && (
                    <div className="flex items-center gap-1">
                      {bookmark.tags.slice(0, 4).map((tag) => (
                        <span key={tag} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-full text-[10px]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Hero image */}
                {bookmark.ogImage && (
                  <div className="mt-6 -mx-2 sm:mx-0">
                    <img
                      src={bookmark.ogImage}
                      alt=""
                      className="w-full rounded-xl object-cover max-h-96"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}
              </header>

              {/* Article body */}
              <article
                className="reader-content pb-24"
                style={contentStyle}
                dangerouslySetInnerHTML={{ __html: content }}
                onClick={(e) => {
                  const anchor = e.target.closest('a');
                  if (anchor?.href) {
                    e.preventDefault();
                    shellOpen(anchor.href);
                  }
                }}
              />

              {/* End of article */}
              <div className="border-t border-zinc-100 dark:border-zinc-800/50 py-8 mb-12 flex flex-col items-center gap-3">
                <p className="text-xs text-zinc-400 dark:text-zinc-500">End of article</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleFavorite(bookmark.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors duration-150 cursor-pointer ${
                      bookmark.isFavorite
                        ? 'border-yellow-200 dark:border-yellow-500/20 bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <Star size={12} fill={bookmark.isFavorite ? 'currentColor' : 'none'} />
                    {bookmark.isFavorite ? 'Favorited' : 'Favorite'}
                  </button>
                  <button
                    onClick={() => shellOpen(bookmark.url)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors duration-150 cursor-pointer"
                  >
                    <ExternalLink size={12} />
                    Open original
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-24">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 mb-4">
                <BookOpen size={24} className="text-zinc-400" />
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">Could not extract readable content from this page.</p>
              <button
                onClick={() => shellOpen(bookmark.url)}
                className="text-sm text-blue-500 hover:text-blue-600 cursor-pointer"
              >
                Open original page
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 p-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full shadow-lg hover:shadow-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-all duration-200 cursor-pointer animate-fadeIn"
          aria-label="Scroll to top"
        >
          <ChevronUp size={18} />
        </button>
      )}
    </div>
  );
}
