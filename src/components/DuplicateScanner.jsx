import { useState, useMemo } from 'react';
import { Copy, Check, Merge, ExternalLink, Star, Tag, StickyNote, Clock, Globe } from 'lucide-react';
import { useBookmarkStore } from '../store/useBookmarkStore.js';
import Modal from './ui/Modal.jsx';
import { timeAgo } from '../lib/timeAgo.js';

/**
 * Duplicate bookmark scanner & merge UI.
 *
 * Opens as a modal, scans all bookmarks for duplicate URLs,
 * and lets the user pick which copy to keep and merge the rest.
 */
export default function DuplicateScanner({ onClose }) {
  const { findDuplicates, mergeDuplicates } = useBookmarkStore();
  const [mergedKeys, setMergedKeys] = useState(new Set());

  const groups = useMemo(() => findDuplicates(), [findDuplicates]);

  // Remove already-merged groups from display
  const visibleGroups = groups.filter(
    (g) => !mergedKeys.has(g[0]?.url?.toLowerCase()),
  );

  const totalDuplicates = visibleGroups.reduce((sum, g) => sum + (g.length - 1), 0);

  return (
    <Modal title="Duplicate Scanner" onClose={onClose} className="max-w-2xl max-h-[80vh] flex flex-col">
      {visibleGroups.length === 0 ? (
        <div className="py-12 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 mb-3">
            <Check size={24} className="text-emerald-500" />
          </div>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">No duplicates found</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">All your bookmarks have unique URLs.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3 shrink-0">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">{visibleGroups.length}</span> duplicate group{visibleGroups.length !== 1 ? 's' : ''} found
              {' '}({totalDuplicates} extra bookmark{totalDuplicates !== 1 ? 's' : ''})
            </p>
          </div>

          <div className="flex-1 overflow-y-auto -mx-6 px-6 space-y-4">
            {visibleGroups.map((group) => (
              <DuplicateGroup
                key={group[0].id}
                group={group}
                onMerge={(keepId, removeIds) => {
                  mergeDuplicates(keepId, removeIds);
                  setMergedKeys((prev) => new Set([...prev, group[0]?.url?.toLowerCase()]));
                }}
              />
            ))}
          </div>
        </>
      )}
    </Modal>
  );
}

function DuplicateGroup({ group, onMerge }) {
  // Default: keep the one with the most data (tags, notes, favorite, oldest)
  const [keepId, setKeepId] = useState(() => {
    const scored = group.map((b) => ({
      id: b.id,
      score:
        (b.tags?.length || 0) * 3 +
        (b.notes ? 5 : 0) +
        (b.isFavorite ? 4 : 0) +
        (b.description ? 2 : 0) +
        (b.readableContent ? 2 : 0) +
        (b.collectionId ? 2 : 0),
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored[0].id;
  });

  const handleMerge = () => {
    const removeIds = group.filter((b) => b.id !== keepId).map((b) => b.id);
    onMerge(keepId, removeIds);
  };

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50">
        <Copy size={14} className="text-amber-500 shrink-0" />
        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate flex-1">
          {group[0].url}
        </span>
        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 shrink-0">
          {group.length} copies
        </span>
      </div>

      {/* Bookmark rows */}
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {group.map((bm) => {
          const isKept = bm.id === keepId;
          return (
            <div
              key={bm.id}
              onClick={() => setKeepId(bm.id)}
              className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors duration-150 ${
                isKept
                  ? 'bg-blue-50/50 dark:bg-blue-500/5'
                  : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/30'
              }`}
            >
              {/* Radio */}
              <div className="pt-0.5 shrink-0">
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors duration-150 ${
                    isKept
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-zinc-300 dark:border-zinc-600'
                  }`}
                >
                  {isKept && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {bm.favicon ? (
                    <img src={bm.favicon} alt="" className="w-4 h-4 rounded shrink-0" />
                  ) : (
                    <Globe size={14} className="text-zinc-400 shrink-0" />
                  )}
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    {bm.title || bm.url}
                  </span>
                  {isKept && (
                    <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded-full shrink-0">
                      Keep
                    </span>
                  )}
                </div>

                {/* Metadata badges */}
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className="flex items-center gap-1 text-[11px] text-zinc-400 dark:text-zinc-500">
                    <Clock size={10} />
                    {timeAgo(bm.createdAt)}
                  </span>
                  {bm.isFavorite && (
                    <span className="flex items-center gap-0.5 text-[11px] text-amber-500">
                      <Star size={10} />
                      Favorite
                    </span>
                  )}
                  {bm.tags?.length > 0 && (
                    <span className="flex items-center gap-0.5 text-[11px] text-zinc-400 dark:text-zinc-500">
                      <Tag size={10} />
                      {bm.tags.join(', ')}
                    </span>
                  )}
                  {bm.notes && (
                    <span className="flex items-center gap-0.5 text-[11px] text-zinc-400 dark:text-zinc-500">
                      <StickyNote size={10} />
                      Has notes
                    </span>
                  )}
                  {bm.source === 'feed' && (
                    <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded-full">
                      Feed
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800">
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
          Tags, notes & favorites from all copies will be merged into the kept bookmark.
        </p>
        <button
          onClick={handleMerge}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-150 cursor-pointer shrink-0 ml-3"
        >
          <Merge size={12} />
          Merge
        </button>
      </div>
    </div>
  );
}
