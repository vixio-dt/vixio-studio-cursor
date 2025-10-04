      <div className="mt-4 rounded-lg border border-accent-1/30 bg-surface-0/70 px-3 py-3 text-[0.7rem]">
        <p className="font-semibold text-text-primary">Cue Template Editor</p>
        <p className="mt-1 text-text-muted">
          Build reusable cue payloads with JSON Schema validation. Inline Ajv errors will appear here in the full
          implementation.
        </p>
      </div>
import { useBoardStore } from '../../state/boardStore'

export function InspectorPlaceholder() {
  const beats = useBoardStore((s) => s.beats)
  const cues = useBoardStore((s) => s.cues)
  const selectedBeatId = useBoardStore((s) => s.selectedBeatId)
  const selectBeat = useBoardStore((s) => s.selectBeat)

  return (
    <div className="flex h-full flex-col text-xs text-text-secondary">
      <div className="text-sm font-semibold text-accent-1">Beats</div>
      <div className="mt-2 space-y-2 overflow-y-auto pr-1">
        {beats.map((beat) => (
          <button
            key={beat.id}
            type="button"
            aria-pressed={selectedBeatId === beat.id}
            onClick={() => selectBeat(beat.id)}
            className={`w-full rounded-lg px-3 py-2 text-left text-xs transition duration-hover ease-brand ${selectedBeatId === beat.id ? 'bg-accent-1/15 text-text-primary shadow-low' : 'bg-surface-0/70 text-text-secondary hover:bg-surface-0'}`}
          >
            <div className="font-semibold uppercase tracking-[0.25em] text-text-muted">{beat.zone}</div>
            <div className="text-sm font-semibold text-text-primary">{beat.title}</div>
          </button>
        ))}
      </div>
      <div className="mt-4 text-sm font-semibold text-accent-2">Cue Summary</div>
      <div className="mt-2 space-y-2 overflow-y-auto pr-1">
        {cues.map((cue) => (
          <div key={cue.id} className="rounded-lg bg-surface-0/80 px-3 py-2 text-xs text-text-secondary shadow-low">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-text-primary">{cue.id}</span>
              <span className="uppercase tracking-[0.2em] text-accent-1">{cue.type}</span>
            </div>
            <div className="mt-1 text-text-muted">Beat: {cue.beatId}</div>
            <div className="text-text-muted">Priority: {cue.priority}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
