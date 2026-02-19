import { useState } from 'react';
import { Rss } from 'lucide-react';
import { useFeedStore } from '../store/useFeedStore.js';
import { useBookmarkStore } from '../store/useBookmarkStore.js';
import Modal from './ui/Modal.jsx';

export default function AddFeed({ onClose }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const addFeed = useFeedStore((s) => s.addFeed);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;

    setLoading(true);
    setError('');
    try {
      await addFeed(trimmed, useBookmarkStore.getState());
      onClose();
    } catch (err) {
      setError("Couldn't fetch feed. Check the URL and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Subscribe to Feed" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="RSS feed URL..."
          autoFocus
          aria-label="RSS feed URL"
          className="w-full px-3 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 mb-3 focus:border-blue-500 dark:focus:border-blue-400 transition-colors duration-150"
        />
        {error && (
          <p className="text-xs text-red-500 mb-3" role="alert">{error}</p>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors duration-150 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-black font-bold rounded-lg transition-colors duration-150 cursor-pointer flex items-center gap-1.5"
          >
            <Rss size={14} />
            {loading ? 'Subscribing...' : 'Subscribe'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
