import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useBookmarkStore, useAllTags } from '../store/useBookmarkStore.js';

export default function TagManager({ bookmarkId, tags }) {
  const [input, setInput] = useState('');
  const [highlightIdx, setHighlightIdx] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dropdownPos, setDropdownPos] = useState(null);
  const { addTag, removeTag } = useBookmarkStore();
  const allTags = useAllTags();
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Filter suggestions: match input, exclude already-applied tags
  const suggestions = input.trim()
    ? allTags
        .filter(
          (t) =>
            t.name.toLowerCase().includes(input.trim().toLowerCase()) &&
            !tags.includes(t.name),
        )
        .slice(0, 8)
    : [];

  // Recalculate portal position whenever suggestions show
  const updatePosition = useCallback(() => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  useEffect(() => {
    setHighlightIdx(0);
  }, [input]);

  useEffect(() => {
    if (showSuggestions && suggestions.length > 0) {
      updatePosition();
    }
  }, [showSuggestions, suggestions.length, updatePosition]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (listRef.current && showSuggestions) {
      const el = listRef.current.children[highlightIdx];
      if (el) el.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightIdx, showSuggestions]);

  const commitTag = (tagName) => {
    const tag = tagName.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      addTag(bookmarkId, tag);
    }
    setInput('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightIdx((i) => (i + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightIdx((i) => (i - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        commitTag(suggestions[highlightIdx].name);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggestions(false);
        return;
      }
    }

    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commitTag(input);
    }
  };

  const suggestionsDropdown =
    showSuggestions && suggestions.length > 0 && dropdownPos
      ? createPortal(
          <ul
            ref={listRef}
            id="tag-suggestions"
            role="listbox"
            style={{
              position: 'fixed',
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: dropdownPos.width,
            }}
            className="z-100 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg py-1 max-h-40 overflow-y-auto"
          >
            {suggestions.map((s, i) => (
              <li
                key={s.name}
                id={`tag-sug-${i}`}
                role="option"
                aria-selected={i === highlightIdx}
                onMouseDown={(e) => {
                  e.preventDefault();
                  commitTag(s.name);
                }}
                onMouseEnter={() => setHighlightIdx(i)}
                className={`flex items-center justify-between px-2.5 py-1.5 text-xs cursor-pointer transition-colors duration-100 ${
                  i === highlightIdx
                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                <span className="truncate">{s.name}</span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 shrink-0 ml-2">
                  {s.count}
                </span>
              </li>
            ))}
          </ul>,
          document.body,
        )
      : null;

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
              aria-label={`Remove tag ${tag}`}
            >
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => {
            // Delay so click on suggestion registers before closing
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Add tag..."
          autoComplete="off"
          role="combobox"
          aria-expanded={showSuggestions && suggestions.length > 0}
          aria-autocomplete="list"
          aria-controls="tag-suggestions"
          aria-activedescendant={
            showSuggestions && suggestions.length > 0
              ? `tag-sug-${highlightIdx}`
              : undefined
          }
          className="w-full px-2 py-1 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-blue-500 dark:focus:border-blue-400 transition-colors duration-150"
        />
        {suggestionsDropdown}
      </div>
    </div>
  );
}
