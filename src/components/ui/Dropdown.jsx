import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Shared accessible dropdown menu.
 *
 * Features:
 * - Click-outside to close
 * - Escape to close
 * - Arrow-key navigation inside menu items
 * - `role="menu"` / `role="menuitem"` semantics
 * - `aria-expanded` on trigger
 *
 * Usage:
 *   <Dropdown
 *     trigger={({ open, ref, toggle, ariaProps }) => (
 *       <button ref={ref} onClick={toggle} {...ariaProps}>Sort</button>
 *     )}
 *     align="right"
 *   >
 *     {({ close }) => (
 *       <>
 *         <Dropdown.Item onClick={() => { doThing(); close(); }}>Option A</Dropdown.Item>
 *       </>
 *     )}
 *   </Dropdown>
 */
export default function Dropdown({ trigger, children, align = 'right', direction = 'down', className = '' }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const toggle = useCallback(() => setOpen((o) => !o), []);
  const close = useCallback(() => setOpen(false), []);

  // Close on click-outside
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Keyboard: Escape + arrow nav
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const items = Array.from(menuRef.current?.querySelectorAll('[role="menuitem"]') ?? []);
        if (!items.length) return;
        const idx = items.indexOf(document.activeElement);
        if (e.key === 'ArrowDown') {
          items[(idx + 1) % items.length].focus();
        } else {
          items[(idx - 1 + items.length) % items.length].focus();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  // Focus first item when opening
  useEffect(() => {
    if (!open || !menuRef.current) return;
    const first = menuRef.current.querySelector('[role="menuitem"]');
    if (first) first.focus();
  }, [open]);

  const ariaProps = {
    'aria-haspopup': 'menu',
    'aria-expanded': open,
  };

  const alignClass = align === 'right' ? 'right-0' : 'left-0';
  const dirClass = direction === 'up' ? 'bottom-full mb-1' : 'top-full mt-1';

  return (
    <div className={`relative ${className}`}>
      {trigger({ open, ref: triggerRef, toggle, ariaProps })}
      {open && (
        <div
          ref={menuRef}
          role="menu"
          className={`absolute ${alignClass} ${dirClass} bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg py-1 min-w-140px z-20 animate-scaleIn`}
        >
          {typeof children === 'function' ? children({ close }) : children}
        </div>
      )}
    </div>
  );
}

/** Single dropdown menu item with proper semantics. */
function Item({ onClick, children, className = '', active = false, danger = false }) {
  const base = 'w-full flex items-center gap-2 text-left px-3 py-1.5 text-sm transition-colors duration-150 cursor-pointer focus:outline-none focus:bg-zinc-100 dark:focus:bg-zinc-800';
  const colorClass = danger
    ? 'text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
    : active
      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10'
      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800';

  return (
    <button role="menuitem" tabIndex={-1} onClick={onClick} className={`${base} ${colorClass} ${className}`}>
      {children}
    </button>
  );
}

/** Section label inside the dropdown */
function Label({ children }) {
  return <div className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400">{children}</div>;
}

/** Visual divider */
function Divider() {
  return <div className="border-t border-zinc-100 dark:border-zinc-800 my-1" role="separator" />;
}

Dropdown.Item = Item;
Dropdown.Label = Label;
Dropdown.Divider = Divider;
