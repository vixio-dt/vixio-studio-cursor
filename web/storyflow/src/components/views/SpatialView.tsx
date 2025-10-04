import { useMemo } from 'react'
import { useBoardStore } from '../../state/boardStore'

const ZONES: Record<string, { label: string; color: string; position: [number, number] }> = {
  lobby: { label: 'Lobby', color: 'bg-accent-1/20', position: [120, 160] },
  entrance: { label: 'Entrance', color: 'bg-accent-2/20', position: [260, 80] },
  lounge: { label: 'Lounge', color: 'bg-accent-warm/25', position: [380, 220] },
}

export function SpatialView() {
  const beats = useBoardStore((s) => s.beats)

  const markers = useMemo(
    () =>
      beats.map((beat) => {
        const zone =
          ZONES[beat.zone] ?? {
            label: beat.zone,
            color: 'bg-surface-0/60',
            position: [Math.random() * 420 + 120, Math.random() * 240 + 80],
          }
        return {
          id: beat.id,
          title: beat.title,
          zone,
        }
      }),
    [beats],
  )

  return (
    <div className="relative h-full w-full overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(87,181,246,0.16),_transparent_65%),_var(--surface-2)]" role="region" aria-label="Spatial zone preview">
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,17,25,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,17,25,0.06)_1px,transparent_1px)]"
        style={{ backgroundSize: '40px 40px' }}
      />
      <div className="absolute inset-0 flex flex-col p-6">
        <header className="mb-4 flex items-center justify-between text-xs uppercase tracking-[0.3em] text-text-secondary">
          Spatial Zones Preview
          <span className="rounded-full bg-surface-0/70 px-2 py-0.5 text-[0.65rem] normal-case tracking-[0.2em] text-text-muted">
            Beats: {markers.length}
          </span>
        </header>
        <div className="relative flex-1 rounded-3xl border border-white/30 bg-surface-0/75 p-6 shadow-high backdrop-blur">
          {markers.map((marker) => (
            <div
              key={marker.id}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-xl border border-white/20 px-3 py-2 text-xs text-text-secondary shadow-low backdrop-blur ${marker.zone.color}`}
              style={{ left: marker.zone.position[0], top: marker.zone.position[1] }}
            >
              <div className="font-semibold uppercase tracking-[0.3em] text-text-muted">{marker.zone.label}</div>
              <div className="mt-1 text-sm font-semibold text-text-primary">{marker.title}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
