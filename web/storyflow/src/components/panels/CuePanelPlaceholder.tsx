import { useMemo, useState } from 'react'
import { useBoardStore } from '../../state/boardStore'

export function CuePanelPlaceholder() {
  const cues = useBoardStore((s) => s.cues)
  const selectedBeatId = useBoardStore((s) => s.selectedBeatId)
  const [filter, setFilter] = useState<'all' | 'beat' | 'lighting' | 'audio' | 'media' | 'previz'>('all')

  const filteredCues = useMemo(() => {
    if (filter === 'all') return cues
    if (filter === 'beat') return selectedBeatId ? cues.filter((cue) => cue.beatId === selectedBeatId) : cues
    return cues.filter((cue) => cue.type.startsWith(
      filter === 'lighting'
        ? 'lighting'
        : filter === 'audio'
        ? 'osc'
        : filter === 'media'
        ? 'media'
        : 'previz',
    ))
  }, [cues, filter, selectedBeatId])

  const emptyText =
    filter === 'beat' && !selectedBeatId
      ? 'Select a beat to see linked cues.'
      : 'No cues match this filter yet.'

  return (
    <div className="flex h-full flex-col text-xs text-text-secondary">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-accent-2">Cues / Collaboration</div>
          <p className="mt-1 text-[0.7rem] text-text-muted">
            Filter cues, watch collaborators, and manage triggers in real time.
          </p>
        </div>
        <div className="flex -space-x-2">
          {[0, 1, 2].map((idx) => (
            <div
              key={idx}
              aria-hidden
              className="size-7 rounded-full border border-white/60 bg-[var(--grad-pill)] shadow-low"
            />
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-[0.7rem]">
        {[
          { value: 'all', label: 'All' },
          { value: 'beat', label: 'Selected Beat' },
          { value: 'lighting', label: 'Lighting' },
          { value: 'audio', label: 'Audio/OSC' },
          { value: 'media', label: 'Media' },
          { value: 'previz', label: 'Previz' },
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={filter === option.value}
            onClick={() => setFilter(option.value as typeof filter)}
            className={`rounded-full px-3 py-1 transition duration-hover ease-brand ${
              filter === option.value
                ? 'bg-[var(--grad-pill)] text-white shadow-mid'
                : 'bg-surface-0/70 text-text-secondary hover:bg-surface-0'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex-1 space-y-2 overflow-y-auto pr-1">
        {filteredCues.length === 0 ? (
          <div className="rounded-lg border border-white/20 bg-surface-0/80 px-3 py-6 text-center text-text-muted">
            {emptyText}
          </div>
        ) : (
          filteredCues.map((cue) => (
            <div key={cue.id} className="rounded-lg border border-white/10 bg-surface-0/90 px-3 py-2 shadow-low">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-text-primary">{cue.id}</span>
                <span className="uppercase tracking-[0.2em] text-accent-1">{cue.type}</span>
              </div>
              <div className="mt-1 text-text-muted">Beat: {cue.beatId}</div>
              <div className="text-text-muted">Trigger: {cue.trigger.kind}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
