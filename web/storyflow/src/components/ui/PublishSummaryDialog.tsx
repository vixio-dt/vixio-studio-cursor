import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { normalizePublishResponse, derivePublishWarnings, type PublishSummary } from '../../utils/publish'
import type { Story } from '../../types/story'

export type PublishSummaryDialogProps = {
  open: boolean
  onClose: () => void
  response?: unknown
  story?: Story | null
}

export function PublishSummaryDialog({ open, onClose, response, story }: PublishSummaryDialogProps) {
  const normalized: PublishSummary | null = response ? normalizePublishResponse(response) : null
  const localWarnings = story ? derivePublishWarnings(story) : []
  const warnings = normalized ? [...normalized.warnings, ...localWarnings] : localWarnings

  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-[1200]">
        <Transition.Child
          as={Fragment}
          enter="transition duration-view ease-brand"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition duration-view ease-brand"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center px-4 py-8">
          <Transition.Child
            as={Fragment}
            enter="transition duration-view ease-brand"
            enterFrom="translate-y-6 opacity-0"
            enterTo="translate-y-0 opacity-100"
            leave="transition duration-view ease-brand"
            leaveFrom="translate-y-0 opacity-100"
            leaveTo="translate-y-6 opacity-0"
          >
            <Dialog.Panel className="w-full max-w-lg rounded-3xl border border-white/30 bg-surface-0/95 p-8 text-sm text-text-primary shadow-high backdrop-blur">
              <Dialog.Title className="text-lg font-semibold">Publish Summary</Dialog.Title>
              <Dialog.Description className="mt-1 text-xs text-text-secondary">
                Review generated events and warnings before dispatching to devices.
              </Dialog.Description>

              {normalized ? (
                <div className="mt-6 grid grid-cols-2 gap-6">
                  <div className="rounded-2xl border border-accent-1/40 bg-accent-1/15 px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.3em] text-text-muted">Events</div>
                    <div className="mt-2 text-2xl font-semibold">{normalized.events ?? 0}</div>
                  </div>
                  <div className="rounded-2xl border border-accent-warm/40 bg-accent-warm/20 px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.3em] text-text-muted">Warnings</div>
                    <div className="mt-2 text-2xl font-semibold">{warnings.length}</div>
                  </div>
                </div>
              ) : null}

              {warnings.length > 0 ? (
                <ul className="mt-6 space-y-2">
                  {warnings.map((warning, idx) => (
                    <li key={`${warning}-${idx}`} className="rounded-xl border border-accent-warm/40 bg-accent-warm/15 px-4 py-3 text-xs text-text-primary">
                      {warning}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-6 rounded-xl border border-accent-1/30 bg-accent-1/15 px-4 py-3 text-xs text-text-secondary">
                  No warnings detected. Ready to publish.
                </p>
              )}

              <div className="mt-8 flex items-center justify-end gap-3 text-xs">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full bg-surface-0/70 px-4 py-1.5 text-text-secondary transition duration-hover ease-brand hover:bg-surface-0"
                >
                  Close
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}

