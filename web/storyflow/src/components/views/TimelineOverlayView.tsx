import { useBoardStore } from '../../state/boardStore'

export function TimelineOverlayView() {
  const cues = useBoardStore((s) => s.cues)

  return (
    <div className="flex h-full flex-col bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_65%)]">
      <header className="flex items-center justify-between border-b border-white/10 bg-black/30 px-6 py-3 text-xs uppercase tracking-[0.3em] text-white/50">
        Timeline Overlay Preview
        <span className="text-[0.7rem] normal-case tracking-[0.2em]">{cues.length} cues</span>
      </header>
      <div className="relative flex-1 overflow-hidden">
        <div className="absolute inset-x-0 top-0 flex gap-1 border-b border-white/10 bg-black/20 px-8 py-4 text-xs text-white/60">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="flex-1 text-center">
              {i * 5}s
            </span>
          ))}
        </div>
        <div className="mt-16 flex h-[calc(100%-64px)] flex-col gap-3 px-6 pb-6">
          {['Lighting', 'Audio', 'Media', 'Previz'].map((lane) => (
            <div key={lane} className="flex h-16 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4">
              <div className="w-24 text-xs uppercase tracking-[0.3em] text-white/50">{lane}</div>
              <div className="flex-1 rounded-xl border border-dashed border-white/20 bg-black/20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
