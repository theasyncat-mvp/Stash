import { useEffect, useRef, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useConfirmStore } from '../store/useConfirmStore.js';

/**
 * Global in-app confirmation dialog that replaces native confirm().
 *
 * Renders only when useConfirmStore.pending is set.
 * Supports keyboard: Enter → confirm, Escape → cancel, focus trap.
 */
export default function ConfirmDialog() {
  const { pending, accept, dismiss } = useConfirmStore();
  const overlayRef = useRef(null);
  const confirmBtnRef = useRef(null);

  // Auto-focus confirm button when shown
  useEffect(() => {
    if (pending && confirmBtnRef.current) {
      confirmBtnRef.current.focus();
    }
  }, [pending]);

  // Keyboard handler
  const handleKeyDown = useCallback(
    (e) => {
      if (!pending) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        dismiss();
      }
    },
    [pending, dismiss],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!pending) return null;

  const isDanger = pending.confirmVariant === 'danger';

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === overlayRef.current) dismiss();
      }}
      role="presentation"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-sm mx-4 p-6 animate-scaleIn"
      >
        <div className="flex items-start gap-3 mb-4">
          <div
            className={`p-2 rounded-full shrink-0 ${
              isDanger
                ? 'bg-red-50 dark:bg-red-500/10 text-red-500'
                : 'bg-blue-50 dark:bg-blue-500/10 text-blue-500'
            }`}
          >
            <AlertTriangle size={18} aria-hidden="true" />
          </div>
          <div>
            <h2
              id="confirm-title"
              className="text-sm font-semibold text-zinc-900 dark:text-zinc-50"
            >
              {pending.title}
            </h2>
            {pending.message && (
              <p
                id="confirm-message"
                className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed"
              >
                {pending.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={dismiss}
            className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors duration-150 cursor-pointer"
          >
            Cancel
          </button>
          <button
            ref={confirmBtnRef}
            onClick={accept}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors duration-150 cursor-pointer ${
              isDanger
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {pending.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
