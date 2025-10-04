import { useEffect } from 'react'
import { useToastStore, type Toast } from '../../state/toastStore'

const VARIANT_STYLES: Record<NonNullable<Toast['variant']>, string> = {
  success: 'border border-accent-1/50 bg-surface-0/90 text-text-primary shadow-low',
  info: 'border border-white/40 bg-surface-0/90 text-text-primary shadow-low',
  warning: 'border border-accent-warm/50 bg-accent-warm/20 text-text-primary shadow-low',
  error: 'border border-red-500/60 bg-red-500/15 text-red-600 shadow-low',
}

export function ToastHub() {
  const toasts = useToastStore((state) => state.toasts)
  const removeToast = useToastStore((state) => state.removeToast)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        useToastStore.getState().clear()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="pointer-events-none fixed right-6 top-6 z-[999] flex w-80 flex-col gap-3 text-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          aria-live="polite"
          className={`pointer-events-auto overflow-hidden rounded-2xl px-4 py-3 transition duration-view ease-brand ${
            VARIANT_STYLES[toast.variant ?? 'info']
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">{toast.title}</div>
              {toast.description ? <div className="mt-1 text-xs text-text-secondary">{toast.description}</div> : null}
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="mt-0.5 text-xs text-text-muted transition hover:text-text-secondary"
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

