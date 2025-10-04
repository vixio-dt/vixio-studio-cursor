import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Edge,
  type Node,
  Panel,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useMemo } from 'react'
import { useBoardStore } from '../../state/boardStore'
export function FlowView() {
  const beats = useBoardStore((s) => s.beats)
  const selectedBeatId = useBoardStore((s) => s.selectedBeatId)
  const selectBeat = useBoardStore((s) => s.selectBeat)

  const nodes = useMemo<Node[]>(
    () =>
      beats.map((beat, index) => ({
        id: beat.id,
        position: { x: index * 280, y: (index % 2) * 180 },
        data: { label: beat.title, zone: beat.zone },
        style: {
          borderRadius: 12,
          border: beat.id === selectedBeatId ? '2px solid var(--accent-1)' : '1px solid rgba(15,17,25,0.12)',
          padding: 16,
          backdropFilter: 'blur(12px)',
          background: 'rgba(255,255,255,0.65)',
          color: 'var(--text-primary)',
          minWidth: 220,
          boxShadow: beat.id === selectedBeatId ? '0 18px 45px rgba(87,181,246,0.25)' : '0 12px 32px rgba(15,17,25,0.12)',
        },
      })),
    [beats, selectedBeatId],
  )

  const edges = useMemo<Edge[]>(
    () =>
      beats
        .map((beat, index) => {
          const next = beats[index + 1]
          if (!next) return null
          return {
            id: `${beat.id}->${next.id}`,
            source: beat.id,
            target: next.id,
            label: 'next',
            animated: true,
            style: { stroke: 'var(--accent-1)', strokeWidth: 2 },
            labelStyle: { fill: 'var(--accent-warm)', fontSize: 12 },
          }
        })
        .filter(Boolean) as Edge[],
    [beats],
  )

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodeClick={(_, node) => selectBeat(node.id)}
      fitView
      snapGrid={[24, 24]}
      snapToGrid
      proOptions={{ hideAttribution: true }}
      defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      panOnScroll
      className="bg-[radial-gradient(circle_at_center,_rgba(87,181,246,0.08),_transparent_60%)]"
    >
      <Background color="rgba(15,17,25,0.08)" gap={32} />
      <MiniMap pannable zoomable nodeColor={() => '#57b5f6'} maskColor="rgba(255,255,255,0.75)" />
      <Controls position="top-left" showInteractive={false} />
      <Panel position="top-left" className="rounded-lg bg-surface-0/70 px-3 py-2 text-xs text-text-secondary shadow-low backdrop-blur-sm">
        Drag beats, connect flows, assign cues. Spatial zones tint nodes in future iterations.
      </Panel>
      <Panel position="top-right" className="rounded-lg bg-surface-0/70 px-3 py-2 text-xs text-text-secondary shadow-low backdrop-blur-sm">
        Use shortcuts: Ctrl/Cmd+S to save, Ctrl/Cmd+P to publish.
      </Panel>
    </ReactFlow>
  )
}
