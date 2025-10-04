export function SceneStripsView() {
  const strips = [
    { name: 'Lighting', color: 'bg-accent-lighting-soft border-accent-lighting/40' },
    { name: 'Audio', color: 'bg-accent-audio-soft border-accent-audio/40' },
    { name: 'Media', color: 'bg-accent-2-soft border-accent-2/40' },
    { name: 'Automation', color: 'bg-surface-0/60 border-surface-0/30' },
  ]

  return (
    <div className="flex h-full flex-col bg-[linear-gradient(180deg,rgba(87,181,246,0.12),rgba(255,255,255,0.85))]" role="region" aria-label="Scene strips overview">
      <header className="flex items-center gap-4 border-b border-white/10 bg-surface-0/70 px-6 py-3 text-xs uppercase tracking-[0.3em] text-text-secondary backdrop-blur-sm">
        Scene Strips Preview
        <span className="rounded-full bg-accent-1/20 px-2 py-0.5 text-[0.65rem] normal-case tracking-[0.2em] text-text-muted">
          Multi-layer storyboard
        </span>
      </header>
      <div className="flex flex-1 flex-col gap-4 px-10 py-6">
        {strips.map((strip) => (
          <div
            key={strip.name}
            className={`flex h-24 items-center rounded-2xl border px-5 py-4 text-sm font-semibold tracking-[0.2em] text-text-secondary shadow-low ${strip.color}`}
          >
            {strip.name}
            <span className="ml-4 rounded-full bg-surface-0/70 px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.2em] text-text-muted">
              TBD
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
