import { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';

/**
 * Shared accessible modal dialog.
 *
 * Features:
 * - Focus trap (Tab / Shift+Tab stay inside)
 * - Escape to close
 * - Click-outside to close
 * - `role="dialog"`, `aria-modal`, `aria-labelledby`
 * - Auto-focuses first focusable element or the close button
 *
 * @param {{ title?: string, onClose: () => void, children: React.ReactNode, className?: string, zIndex?: string }} props
 */
export default function Modal({ title, onClose, children, className = 'max-w-md', zIndex = 'z-50' }) {
  const overlayRef = useRef(null);
  const panelRef = useRef(null);

  // ─── Focus trap ────────────────────────────────────────────────
  const getFocusable = useCallback(() => {
    if (!panelRef.current) return [];
    return Array.from(
      panelRef.current.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input:not([disabled]), select, [tabindex]:not([tabindex="-1"])'
      )
    );
  }, []);

  useEffect(() => {
    // Auto-focus the first focusable element inside the panel
    const els = getFocusable();
    if (els.length) els[0].focus();
  }, [getFocusable]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        const focusable = getFocusable();
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, getFocusable]);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div
      ref={overlayRef}
      className={`fixed inset-0 ${zIndex} flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fadeIn`}
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={`bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full mx-4 p-6 animate-scaleIn ${className}`}
      >
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 id="modal-title" className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {title}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer transition-colors duration-150"
            >
              <X size={16} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
