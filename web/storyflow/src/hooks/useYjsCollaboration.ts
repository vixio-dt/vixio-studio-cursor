import { useEffect, useRef, useState } from 'react'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import type { Story } from '../types/story'
import equal from 'fast-deep-equal'
import { cloneStory } from '../utils/storyClone'
import { nanoid } from 'nanoid'

export type CollabStatus = 'disconnected' | 'connecting' | 'connected'

const ROOM_NAME = import.meta.env.VITE_COLLAB_ROOM || 'vixio-storyflow'
const WS_URL = import.meta.env.VITE_COLLAB_WS_URL || 'ws://localhost:8080/collab'
const AUTH_TOKEN = import.meta.env.VITE_AUTH_TOKEN

const storiesEqual = (a: Story | null, b: Story | null) => (a && b ? equal(a, b) : a === b)

type UseYjsCollaborationOpts = {
  enabled: boolean
  story: Story | null
  onRemoteStory: (story: Story) => void
}

export function useYjsCollaboration({ enabled, story, onRemoteStory }: UseYjsCollaborationOpts) {
  const docRef = useRef<Y.Doc | null>(null)
  const providerRef = useRef<WebsocketProvider | null>(null)
  const yStoryRef = useRef<Y.Map<Story> | null>(null)
  const lastLocalRef = useRef<Story | null>(null)
  const clientIdRef = useRef<string>(nanoid(8))

  const [status, setStatus] = useState<CollabStatus>('disconnected')
  const [peers, setPeers] = useState(0)

  useEffect(() => {
    setStatus(enabled ? 'connecting' : 'disconnected')
    setPeers(enabled ? 1 : 0)
    if (!enabled) return

    const doc = new Y.Doc()
    const provider = new WebsocketProvider(WS_URL, ROOM_NAME, doc, {
      connect: true,
      params: AUTH_TOKEN ? { token: AUTH_TOKEN } : undefined,
    })
    const yStory = doc.getMap<Story>('story')

    docRef.current = doc
    providerRef.current = provider
    yStoryRef.current = yStory

    const applyRemote = () => {
      const remote = yStory.get('current')
      if (!remote) return
      if (lastLocalRef.current && storiesEqual(remote, lastLocalRef.current)) return
      const cloned = cloneStory(remote)
      onRemoteStory(cloned)
    }

    const handleStatus = (event: { status: 'connected' | 'connecting' }) => {
      setStatus(event.status)
    }

    const awareness = provider.awareness
    const updatePeers = () => {
      const count = awareness.getStates().size || 0
      setPeers(Math.max(count, 1))
    }

    awareness.setLocalStateField('user', { id: clientIdRef.current, ts: Date.now() })
    awareness.on('change', updatePeers)
    updatePeers()

    doc.on('update', applyRemote)
    provider.on('status', handleStatus)

    if (story) {
      const cloned = cloneStory(story)
      yStory.set('current', cloned)
      lastLocalRef.current = cloned
    }

    return () => {
      doc.off('update', applyRemote)
      provider.off('status', handleStatus)
      awareness.off('change', updatePeers)
      provider.destroy()
      doc.destroy()
      docRef.current = null
      providerRef.current = null
      yStoryRef.current = null
      lastLocalRef.current = null
      setStatus('disconnected')
      setPeers(0)
    }
  }, [enabled, onRemoteStory, story])

  useEffect(() => {
    if (!enabled) return
    if (!story) return
    if (!docRef.current || !yStoryRef.current) return

    const yStory = yStoryRef.current
    const current = yStory.get('current') ?? null
    if (current && storiesEqual(current, story)) return
    const cloned = cloneStory(story)
    yStory.set('current', cloned)
    lastLocalRef.current = cloned
  }, [enabled, story])

  return { status, peers }
}
