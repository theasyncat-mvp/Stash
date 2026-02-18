import { create } from 'zustand';

/**
 * Confirmation dialog store.
 *
 * Usage:
 *   const confirmed = await useConfirmStore.getState().confirm({
 *     title: 'Delete collection?',
 *     message: 'Bookmarks will become uncollected.',
 *     confirmLabel: 'Delete',        // optional, default "Confirm"
 *     confirmVariant: 'danger',       // optional: 'danger' | 'primary' (default)
 *   });
 *   if (confirmed) { … }
 */
export const useConfirmStore = create((set) => ({
  /** @type {null | { title: string, message: string, confirmLabel?: string, confirmVariant?: string, resolve: (v:boolean)=>void }} */
  pending: null,

  confirm: (options) =>
    new Promise((resolve) => {
      set({
        pending: {
          title: options.title || 'Are you sure?',
          message: options.message || '',
          confirmLabel: options.confirmLabel || 'Confirm',
          confirmVariant: options.confirmVariant || 'primary',
          resolve,
        },
      });
    }),

  accept: () => {
    const { pending } = useConfirmStore.getState();
    if (pending) pending.resolve(true);
    set({ pending: null });
  },

  dismiss: () => {
    const { pending } = useConfirmStore.getState();
    if (pending) pending.resolve(false);
    set({ pending: null });
  },
}));
