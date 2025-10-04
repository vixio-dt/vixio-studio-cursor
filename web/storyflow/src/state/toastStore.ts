import { nanoid } from 'nanoid'
import { create } from 'zustand'

export type ToastVariant = 'success' | 'info' | 'warning' | 'error'

export type Toast = {
  id?: string
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

type ToastInternal = Required<Pick<Toast, 'id'>> & Toast & { createdAt: number }

const DEFAULT_DURATION = 4000

type ToastStore = {
  toasts: ToastInternal[]
  addToast: (toast: Toast) => string
  removeToast: (id: string) => void
  clear: () => void
}

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],
  addToast: (toast) => {
    const id = toast.id ?? nanoid()
    const next: ToastInternal = {
      id,
      title: toast.title,
      description: toast.description,
      variant: toast.variant ?? 'info',
      duration: toast.duration ?? DEFAULT_DURATION,
      createdAt: Date.now(),
    }
    set((state) => ({ toasts: [...state.toasts, next] }))

    const duration = next.duration ?? DEFAULT_DURATION
    if (duration > 0) {
      const timeout = typeof window !== 'undefined' ? window.setTimeout : setTimeout
      timeout(() => {
        get().removeToast(id)
      }, duration)
    }

    return id
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
  clear: () => set({ toasts: [] }),
}))

