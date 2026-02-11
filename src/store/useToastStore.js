import { create } from 'zustand';

let toastId = 0;

export const useToastStore = create((set, get) => ({
  toasts: [],

  addToast: (message, type = 'info', options = {}) => {
    const id = ++toastId;
    const toast = {
      id,
      message,
      type,
      undoAction: options.undoAction || null,
      duration: options.duration || 4000,
    };
    set({ toasts: [...get().toasts, toast] });

    if (toast.duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, toast.duration);
    }

    return id;
  },

  removeToast: (id) => {
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  },

  success: (message, options) => get().addToast(message, 'success', options),
  error: (message, options) => get().addToast(message, 'error', options),
  info: (message, options) => get().addToast(message, 'info', options),
}));
