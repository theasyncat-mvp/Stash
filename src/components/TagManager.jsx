import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { useBookmarkStore } from '../store/useBookmarkStore.js';

export default function TagManager({ bookmarkId, tags }) {
  const [input, setInput] = useState('');
  const { addTag, removeTag } = useBookmarkStore();

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = input.trim().toLowerCase();
      if (tag && !tags.includes(tag)) {
        addTag(bookmarkId, tag);
      }
      setInput('');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs px-2 py-0.5 rounded-full"
          >
            {tag}
            <button
              onClick={() => removeTag(bookmarkId, tag)}
              className="hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
            >
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-1">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add tag..."
          className="flex-1 px-2 py-1 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-blue-500 dark:focus:border-blue-400 transition-colors duration-150"
        />
      </div>
    </div>
  );
}
