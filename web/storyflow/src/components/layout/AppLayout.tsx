import type { ReactNode } from 'react'
import { useBoardStore, type StoryView } from '../../state/boardStore'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { useToastStore } from '../../state/toastStore'
import { cloneStory } from '../../utils/storyClone'

const VIEW_LABELS: Record<StoryView, string> = {
  flow: 'Flow',
  timeline: 'Timeline Overlay',
  scene: 'Scene Strips',
  spatial: 'Spatial',
}

export function AppLayout({
  main,
  inspector,
  cuePanel,
}: {
  main: ReactNode
  inspector?: ReactNode
  cuePanel?: ReactNode
}) {
  const view = useBoardStore((state) => state.view)
  const setView = useBoardStore((state) => state.setView)
  const lastSaved = useBoardStore((state) => state.lastSaved)
  const isDirty = useBoardStore((state) => state.isDirty)
  const collabEnabled = useBoardStore((state) => state.collabEnabled)
  const collabStatus = useBoardStore((state) => state.collabStatus)
  const collabPeers = useBoardStore((state) => state.collabPeers)
  const enableCollab = useBoardStore((state) => state.enableCollab)
  const saveStory = useBoardStore((state) => state.saveStory)
  const publishStory = useBoardStore((state) => state.publishStory)
  const story = useBoardStore((state) => state.story)
  const setPublishDialogOpen = useBoardStore((state) => state.setPublishDialogOpen)
  const setPublishResponse = useBoardStore((state) => state.setPublishResponse)
  const addToast = useToastStore((state) => state.addToast)
  const [publishLoading, setPublishLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  const statusLabel = useMemo(() => {
    if (isDirty) return 'Unsaved changes'
    if (lastSaved) return `Saved ${new Date(lastSaved).toLocaleTimeString()}`
    return 'No changes yet'
  }, [isDirty, lastSaved])

  const collabLabel = useMemo(() => {
    if (!collabEnabled) return 'Collab off'
    if (collabStatus === 'connecting') return 'Collab: connecting…'
    if (collabStatus === 'connected') return `Collab: ${collabPeers} online`
    return 'Collab: offline'
  }, [collabEnabled, collabPeers, collabStatus])

  const handleSave = useCallback(async () => {
    if (!story || saveLoading) return
    setSaveLoading(true)
    try {
      await saveStory(cloneStory(story))
      addToast({ title: 'Story saved', description: 'Gateway confirms persistence.', variant: 'success' })
    } catch (error) {
      addToast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'error',
      })
    } finally {
      setSaveLoading(false)
    }
  }, [story, saveLoading, saveStory, addToast])

  const handlePublish = useCallback(async () => {
    if (!story || publishLoading) return
    setPublishLoading(true)
    try {
      const response = await publishStory(cloneStory(story))
      setPublishResponse(response)
      setPublishDialogOpen(true)
      addToast({ title: 'Publish in progress', description: 'Review summary for warnings.', variant: 'info' })
    } catch (error) {
      addToast({
        title: 'Publish failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'error',
      })
    } finally {
      setPublishLoading(false)
    }
  }, [story, publishLoading, publishStory, setPublishResponse, setPublishDialogOpen, addToast])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const meta = event.metaKey || event.ctrlKey
      if (meta && event.key.toLowerCase() === 's') {
        event.preventDefault()
        handleSave()
      } else if (meta && event.key.toLowerCase() === 'p') {
        event.preventDefault()
        handlePublish()
      } else if (!meta && !event.altKey && !event.shiftKey) {
        if (event.key === '1') setView('flow')
        if (event.key === '2') setView('timeline')
        if (event.key === '3') setView('scene')
        if (event.key === '4') setView('spatial')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleSave, handlePublish, setView])

  return (
    <div className="flex h-full w-full flex-col bg-surface-1 text-text-primary">
      <header className="flex items-center justify-between border-b border-black/5 bg-surface-0/80 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-accent-1 font-semibold tracking-wide text-white">
            VS
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-black/60">Vixio Studio</div>
            <div className="flex items-center gap-3">
              <div className="text-lg font-semibold">Storyflow Lab</div>
              <button
                type="button"
                onClick={() => enableCollab(!collabEnabled)}
                className={`rounded-full px-3 py-1 text-xs transition duration-hover ease-brand ${collabEnabled ? 'bg-accent-2 text-white shadow-mid' : 'bg-surface-0/60 text-text-secondary hover:bg-surface-0'}`}
                aria-pressed={collabEnabled}
                aria-label={collabEnabled ? 'Disable collaboration' : 'Enable collaboration'}
              >
                {collabEnabled ? 'Disable Collaboration' : 'Enable Collaboration'}
              </button>
            </div>
            <div className="text-[0.65rem] uppercase tracking-[0.3em] text-black/40" role="status" aria-live="polite">
              {statusLabel}
            </div>
            <div className="text-[0.65rem] tracking-[0.2em] text-black/40" aria-live="polite">
              {collabLabel}
            </div>
          </div>
        </div>
        <nav className="flex items-center gap-2 text-xs text-black/60" aria-label="Storyflow views">
          {Object.entries(VIEW_LABELS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setView(key as StoryView)}
              className={`rounded-full px-4 py-1.5 transition duration-view ease-brand ${view === key ? 'bg-[var(--grad-pill)] text-white shadow-mid' : 'bg-surface-0/70 text-text-secondary hover:bg-surface-0'}`}
              aria-pressed={view === key}
            >
              {label}
            </button>
          ))}
          <div className="ml-4 flex items-center gap-2">
            <button
              type="button"
              disabled={!story || (!isDirty && !saveLoading)}
              onClick={handleSave}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition duration-hover ease-brand ${
                isDirty || saveLoading ? 'bg-accent-warm text-text-primary shadow-low' : 'bg-surface-0/70 text-text-muted cursor-not-allowed'
              }`}
              aria-disabled={!story || (!isDirty && !saveLoading)}
            >
              {saveLoading ? 'Saving…' : isDirty ? 'Save *' : 'Saved'}
            </button>
            <button
              type="button"
              disabled={!story || publishLoading}
              onClick={handlePublish}
              className="rounded-full bg-accent-1 px-4 py-1.5 text-xs font-medium text-white shadow-mid transition duration-hover ease-brand hover:shadow-high disabled:cursor-not-allowed disabled:bg-accent-1/50"
              aria-disabled={!story || publishLoading}
            >
              {publishLoading ? 'Publishing…' : 'Publish'}
            </button>
          </div>
        </nav>
      </header>
      <main id="storyflow-main" className="flex h-full w-full bg-[radial-gradient(circle_at_top_left,_rgba(87,181,246,0.08),_transparent_55%),_var(--surface-2)] text-text-primary">
        <aside className="w-72 border-r border-white/10 bg-surface-0/80 px-4 py-3 backdrop-blur-sm">
          {inspector ?? (
            <div>
              <div className="text-sm font-semibold text-accent-1">Inspector</div>
              <p className="mt-3 text-xs text-text-secondary">
                Select beats and cues to edit metadata, constraints, zones, and cue templates.
              </p>
            </div>
          )}
        </aside>
        <section className="relative flex-1 overflow-hidden">{main}</section>
        <aside className="w-72 border-l border-white/10 bg-surface-0/70 px-4 py-3 backdrop-blur-sm">
          {cuePanel ?? (
            <div>
              <div className="text-sm font-semibold text-accent-2">Cues / Comments</div>
              <p className="mt-3 text-xs text-text-secondary">
                Upcoming cue list, comment threads, and collaboration indicators will appear here.
              </p>
            </div>
          )}
        </aside>
      </main>
    </div>
  )
}
