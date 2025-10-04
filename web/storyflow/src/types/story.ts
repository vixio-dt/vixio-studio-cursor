export type StoryIdea = {
  text: string
  tags: string[]
  notes: string
}

export type StoryCharacter = {
  id: string
  name: string
  role: string
}

export type StoryCueTrigger =
  | { kind: 'manual' }
  | { kind: 'state'; when: string }
  | { kind: 'timecode'; tc: string }

export type LightingCueArgs = {
  universe: number
  start: number
  count: number
  level: number
  time?: number
}

export type OscCueArgs = {
  address: string
  args?: Array<string | number | boolean>
}

export type MediaCueArgs = {
  target: string
  clip: string
  layer?: string
  in?: number
  speed?: number
  blend?: string
}

export type PrevizMarkerArgs = {
  id: string
  pos: { x: number; y: number; z: number }
  color?: string
  label?: string
}

export type PrevizCameraArgs = {
  pos: { x: number; y: number; z: number }
  target: { x: number; y: number; z: number }
  dur: number
}

export type StoryCueType =
  | { type: 'lighting.fade'; args: LightingCueArgs }
  | { type: 'osc.send'; args: OscCueArgs }
  | { type: 'media.play'; args: MediaCueArgs }
  | { type: 'previz.marker.show'; args: PrevizMarkerArgs }
  | { type: 'previz.camera.flyTo'; args: PrevizCameraArgs }

export type StoryCue = {
  id: string
  beatId: string
  priority: number
  failover?: 'none' | 'alternate' | 'skip'
  trigger: StoryCueTrigger
} & StoryCueType

export type StoryBeat = {
  id: string
  title: string
  order: number
  tHint?: number
  zone: string
  roles?: string[]
  notes?: string
}

export type StoryTimelineEvent = {
  t: number
  payload: { id: string; args: Record<string, unknown> }
  meta?: { priority?: number }
}

export type StoryMeta = {
  version: string
  lastPublished?: string
}

export type Story = {
  idea: StoryIdea
  characters: StoryCharacter[]
  beats: StoryBeat[]
  cues: StoryCue[]
  meta: StoryMeta
}
