import { Search, X } from 'lucide-react';
import { useBookmarkStore } from '../store/useBookmarkStore.js';

export default function SearchBar() {
  const { searchQuery, setSearchQuery, setActiveView, activeView } = useBookmarkStore();

  const handleChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val && activeView !== 'search') {
      setActiveView('search');
    }
  };

  const clear = () => {
    setSearchQuery('');
    if (activeView === 'search') {
      setActiveView('inbox');
    }
  };

  return (
    <div className="relative px-3 mb-2">
      <Search size={14} className="absolute left-5.5 top-1/2 -translate-y-1/2 text-zinc-400" />
      <input
        type="text"
        value={searchQuery}
        onChange={handleChange}
        placeholder="Search..."
        className="w-full pl-8 pr-8 py-1.5 text-sm bg-zinc-200/60 dark:bg-zinc-800 rounded-lg border-none outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition-colors duration-150"
      />
      {searchQuery && (
        <button
          onClick={clear}
          className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}
