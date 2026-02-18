import { ArrowUpDown } from 'lucide-react';
import { useBookmarkStore } from '../store/useBookmarkStore.js';
import Dropdown from './ui/Dropdown.jsx';

const sortOptions = [
  { value: 'manual', label: 'Manual order' },
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'title-asc', label: 'Title A-Z' },
  { value: 'title-desc', label: 'Title Z-A' },
  { value: 'domain', label: 'Domain' },
];

export default function SortDropdown() {
  const { sortBy, setSortBy } = useBookmarkStore();

  const current = sortOptions.find((o) => o.value === sortBy) || sortOptions[0];

  return (
    <Dropdown
      trigger={({ ref, toggle, ariaProps }) => (
        <button
          ref={ref}
          onClick={toggle}
          {...ariaProps}
          className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors duration-150 cursor-pointer"
          aria-label={`Sort by: ${current.label}`}
        >
          <ArrowUpDown size={13} />
          <span className="hidden sm:inline">{current.label}</span>
        </button>
      )}
    >
      {({ close }) =>
        sortOptions.map((opt) => (
          <Dropdown.Item
            key={opt.value}
            active={sortBy === opt.value}
            onClick={() => { setSortBy(opt.value); close(); }}
          >
            {opt.label}
          </Dropdown.Item>
        ))
      }
    </Dropdown>
  );
}
