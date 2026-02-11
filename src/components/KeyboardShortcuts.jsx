import { X } from 'lucide-react';

const shortcuts = [
  { keys: ['Ctrl', 'K'], description: 'Open command palette' },
  { keys: ['Ctrl', 'N'], description: 'Add new bookmark' },
  { keys: ['Ctrl', 'B'], description: 'Toggle bulk select mode' },
  { keys: ['1'], description: 'Go to Inbox' },
  { keys: ['2'], description: 'Go to All Bookmarks' },
  { keys: ['3'], description: 'Go to Favorites' },
  { keys: ['4'], description: 'Go to Archive' },
  { keys: ['G'], description: 'Toggle Grid view' },
  { keys: ['L'], description: 'Toggle List view' },
  { keys: ['Esc'], description: 'Close panel / modal' },
  { keys: ['?'], description: 'Show keyboard shortcuts' },
];

export default function KeyboardShortcuts({ onClose }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-md mx-4 p-6 animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Keyboard Shortcuts</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer transition-colors duration-150">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-2">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-1">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">{s.description}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((key) => (
                  <kbd
                    key={key}
                    className="text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-1.5 py-0.5 rounded min-w-[24px] text-center"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
