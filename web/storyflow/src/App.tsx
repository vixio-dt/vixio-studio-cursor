import './index.css'
import { Fragment, useEffect, useState } from 'react'
import { Transition } from '@headlessui/react'
import { useBoardStore, type StoryView } from './state/boardStore'
import { mockStory } from './data/mockStory'
import { AppLayout } from './components/layout/AppLayout'
import { FlowView } from './components/views/FlowView'
import { TimelineOverlayView } from './components/views/TimelineOverlayView'
import { SceneStripsView } from './components/views/SceneStripsView'
import { SpatialView } from './components/views/SpatialView'
import { InspectorPlaceholder } from './components/panels/InspectorPlaceholder'
import { CuePanelPlaceholder } from './components/panels/CuePanelPlaceholder'
import { fetchStory } from './utils/gatewayClient'
import { ToastHub } from './components/ui/ToastHub'
import { PublishSummaryDialog } from './components/ui/PublishSummaryDialog'
import { usePrefersReducedMotion } from './hooks/usePrefersReducedMotion'

function App() {
  const loadStory = useBoardStore((s) => s.loadStory)
  const view = useBoardStore((s) => s.view)
  const publishResponse = useBoardStore((s) => s.publishResponse)
  const setPublishResponse = useBoardStore((s) => s.setPublishResponse)
  const publishDialogOpen = useBoardStore((s) => s.publishDialogOpen)
  const setPublishDialogOpen = useBoardStore((s) => s.setPublishDialogOpen)
  const story = useBoardStore((s) => s.story)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await fetchStory()
        if (!cancelled) loadStory(data, true)
      } catch {
        if (!cancelled) loadStory(mockStory, true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [loadStory])

  const mainView = <StoryViewStage view={view} />

  return (
    <>
      <AppLayout main={mainView} inspector={<InspectorPlaceholder />} cuePanel={<CuePanelPlaceholder />} />
      <ToastHub />
      <PublishSummaryDialog
        open={publishDialogOpen}
        onClose={() => {
          setPublishDialogOpen(false)
          setPublishResponse(null)
        }}
        response={publishResponse}
        story={story}
      />
    </>
  )
}

export default App

type ViewLayer = { id: string; view: StoryView }

function createLayer(view: StoryView): ViewLayer {
  return { id: `${view}-${Date.now()}-${Math.random().toString(16).slice(2)}`, view }
}

function renderStoryView(view: StoryView): JSX.Element {
  switch (view) {
    case 'timeline':
      return <TimelineOverlayView />
    case 'scene':
      return <SceneStripsView />
    case 'spatial':
      return <SpatialView />
    default:
      return <FlowView />
  }
}

function StoryViewStage({ view }: { view: StoryView }) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const [layers, setLayers] = useState<ViewLayer[]>(() => [createLayer(view)])

  useEffect(() => {
    if (prefersReducedMotion) {
      setLayers([createLayer(view)])
      return
    }
    setLayers((prev) => {
      const last = prev[prev.length - 1]
      if (last?.view === view) return prev
      const next = [...prev, createLayer(view)]
      return next.slice(-2)
    })
  }, [view, prefersReducedMotion])

  if (prefersReducedMotion) {
    return <div className="h-full w-full">{renderStoryView(view)}</div>
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      {layers.map((layer, idx) => (
        <Transition
          key={layer.id}
          show={idx === layers.length - 1}
          appear
          as={Fragment}
          enter="transition duration-view ease-brand"
          enterFrom="opacity-0 translate-y-8 scale-[0.98]"
          enterTo="opacity-100 translate-y-0 scale-100"
          leave="transition duration-view ease-brand"
          leaveFrom="opacity-100 translate-y-0 scale-100"
          leaveTo="opacity-0 -translate-y-6 scale-[0.98]"
          afterLeave={() =>
            setLayers((prev) => prev.filter((entry) => entry.id !== layer.id))
          }
        >
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(140,209,255,0.12),_transparent_70%)]" />
            {renderStoryView(layer.view)}
          </div>
        </Transition>
      ))}
    </div>
  )
}
