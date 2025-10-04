import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import equal from 'fast-deep-equal'
import type { Story, StoryBeat, StoryCue, StoryTimelineEvent } from '../types/story'
import { cloneStory } from '../utils/storyClone'
import { useEffect, useMemo } from 'react'
import { useYjsCollaboration } from '../hooks/useYjsCollaboration'
import { publishStory as gatewayPublishStory, saveStory as gatewaySaveStory, type PublishResponse } from '../utils/gatewayClient'

export type StoryView = 'flow' | 'timeline' | 'scene' | 'spatial'

export type BoardState = {
  story: Story | null
  beats: StoryBeat[]
  cues: StoryCue[]
  timeline: StoryTimelineEvent[]
  selectedBeatId: string | null
  selectedCueId: string | null
  view: StoryView
  undoStack: Story[]
  redoStack: Story[]
  lastSaved: string | null
  isDirty: boolean
  collabEnabled: boolean
  collabStatus: 'disconnected' | 'connecting' | 'connected'
  collabPeers: number
  publishResponse: PublishResponse | null
  publishDialogOpen: boolean
  setView: (view: StoryView) => void
  selectBeat: (id: string | null) => void
  selectCue: (id: string | null) => void
  enableCollab: (enabled: boolean) => void
  loadStory: (story: Story, markClean?: boolean) => void
  loadStoryFromRemote: (story: Story) => void
  updateStory: (updater: (story: Story) => Story) => void
  applyTimeline: (timeline: StoryTimelineEvent[]) => void
  commitSave: () => void
  saveStory: (story: Story) => Promise<unknown>
  publishStory: (story: Story) => Promise<PublishResponse>
  setPublishResponse: (response: PublishResponse | null) => void
  setPublishDialogOpen: (open: boolean) => void
  undo: () => void
  redo: () => void
}

export type BoardStoreSelector<T> = (state: BoardState) => T

const withPersistence = persist<BoardState>(
  (set, get) => ({
    story: null,
    beats: [],
    cues: [],
    timeline: [],
    selectedBeatId: null,
    selectedCueId: null,
    view: 'flow',
    undoStack: [],
    redoStack: [],
    lastSaved: null,
    isDirty: false,
    collabEnabled: false,
    collabStatus: 'disconnected',
    collabPeers: 0,
    publishResponse: null,
    publishDialogOpen: false,
    setView: (view) => set({ view }),
    selectBeat: (id) => set({ selectedBeatId: id }),
    selectCue: (id) => set({ selectedCueId: id }),
    enableCollab: (enabled) => set({ collabEnabled: enabled }),
    loadStory: (story, markClean = false) =>
      set({
        story,
        beats: story.beats,
        cues: story.cues,
        selectedBeatId: story.beats[0]?.id ?? null,
        selectedCueId: null,
        timeline: [],
        undoStack: [],
        redoStack: [],
        isDirty: !markClean,
        lastSaved: markClean ? new Date().toISOString() : get().lastSaved,
      }),
    loadStoryFromRemote: (story) =>
      set((state) => ({
        story,
        beats: story.beats,
        cues: story.cues,
        selectedBeatId: story.beats[0]?.id ?? null,
        selectedCueId: null,
        isDirty: state.isDirty,
      })),
    updateStory: (updater) =>
      set((state) => {
        if (!state.story) return state
        const current = state.story
        const nextStory = updater(cloneStory(current))
        if (equal(current, nextStory)) return state
        return {
          story: nextStory,
          beats: nextStory.beats,
          cues: nextStory.cues,
          undoStack: [...state.undoStack, cloneStory(current)],
          redoStack: [],
          isDirty: true,
        }
      }),
    applyTimeline: (timeline) => set({ timeline }),
    commitSave: () => set({ lastSaved: new Date().toISOString(), isDirty: false }),
    saveStory: async (story) => {
      const result = await gatewaySaveStory(story)
      set({ lastSaved: new Date().toISOString(), isDirty: false })
      return result
    },
    publishStory: async (story) => {
      const result = await gatewayPublishStory(story)
      set({ lastSaved: new Date().toISOString(), isDirty: false, publishResponse: result })
      return result
    },
    setPublishResponse: (response) => set({ publishResponse: response }),
    setPublishDialogOpen: (open) => set({ publishDialogOpen: open }),
    undo: () =>
      set((state) => {
        const previous = state.undoStack[state.undoStack.length - 1]
        if (!previous) return state
        const newUndo = state.undoStack.slice(0, -1)
        const current = state.story ? cloneStory(state.story) : null
        return {
          story: cloneStory(previous),
          beats: previous.beats,
          cues: previous.cues,
          undoStack: newUndo,
          redoStack: current ? [...state.redoStack, current] : state.redoStack,
          selectedBeatId: previous.beats[0]?.id ?? null,
          selectedCueId: null,
          isDirty: true,
        }
      }),
    redo: () =>
      set((state) => {
        const next = state.redoStack[state.redoStack.length - 1]
        if (!next) return state
        const newRedo = state.redoStack.slice(0, -1)
        const current = state.story ? cloneStory(state.story) : null
        return {
          story: cloneStory(next),
          beats: next.beats,
          cues: next.cues,
          redoStack: newRedo,
          undoStack: current ? [...state.undoStack, current] : state.undoStack,
          selectedBeatId: next.beats[0]?.id ?? null,
          selectedCueId: null,
          isDirty: true,
        }
      }),
  }),
  { name: 'vixio-storyflow-board' },
)

export const useBoardStore = create<BoardState>(withPersistence)

export function useCollaboration() {
  const enabled = useBoardStore((s) => s.collabEnabled)
  const story = useBoardStore((s) => s.story)
  const loadRemote = useBoardStore((s) => s.loadStoryFromRemote)
  const setStatus = useBoardStore((s) => s.collabStatus)
  const setPeers = useBoardStore((s) => s.collabPeers)

  const handler = useMemo(() => ({ onRemoteStory: loadRemote, story }), [loadRemote, story])
  const { status, peers } = useYjsCollaboration({
    enabled,
    story: handler.story,
    onRemoteStory: handler.onRemoteStory,
  })

  useEffect(() => {
    setStatus(status)
  }, [setStatus, status])

  useEffect(() => {
    setPeers(peers)
  }, [peers, setPeers])
}
