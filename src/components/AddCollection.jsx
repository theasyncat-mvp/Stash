import { useState } from 'react';
import { FolderOpen } from 'lucide-react';
import { useBookmarkStore } from '../store/useBookmarkStore.js';
import Modal from './ui/Modal.jsx';

export default function AddCollection({ onClose }) {
  const [name, setName] = useState('');
  const createCollection = useBookmarkStore((s) => s.createCollection);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    await createCollection(trimmed);
    onClose();
  };

  return (
    <Modal title="New Collection" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Collection name..."
          autoFocus
          aria-label="Collection name"
          className="w-full px-3 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 mb-4 focus:border-blue-500 dark:focus:border-blue-400 transition-colors duration-150"
        />
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
            className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-150 cursor-pointer flex items-center gap-1.5"
          >
            <FolderOpen size={14} />
            Create
          </button>
        </div>
      </form>
    </Modal>
  );
}
