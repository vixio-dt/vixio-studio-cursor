import type { Story } from '../types/story'

export const mockStory: Story = {
  idea: {
    text: 'Immersive foyer welcome that transitions to promo bursts and spatial cues.',
    tags: ['lobby', 'welcome', 'promo'],
    notes: 'Draft narrative for SG cinema lobby pre-show',
  },
  characters: [
    { id: 'operator', name: 'Operator', role: 'Operator' },
    { id: 'producer', name: 'Producer', role: 'Reviewer' },
  ],
  beats: [
    { id: 'beat-welcome', title: 'Welcome', order: 1, zone: 'lobby', roles: ['operator'] },
    { id: 'beat-promo', title: 'Promo Burst', order: 2, zone: 'lobby', roles: ['operator'] },
    { id: 'beat-reset', title: 'Reset Loop', order: 3, zone: 'lobby', roles: ['operator'] },
  ],
  cues: [
    {
      id: 'cue-house-warm',
      beatId: 'beat-welcome',
      priority: 50,
      trigger: { kind: 'manual' },
      type: 'lighting.fade',
      args: { universe: 1, start: 1, count: 12, level: 0.3, time: 3 },
    },
    {
      id: 'cue-bgm',
      beatId: 'beat-welcome',
      priority: 40,
      trigger: { kind: 'manual' },
      type: 'media.play',
      args: { target: 'audio.dante:/bus/bgm', clip: 'ambient_loop.wav', layer: 'loop', blend: 'add' },
    },
    {
      id: 'cue-promo-spot',
      beatId: 'beat-promo',
      priority: 70,
      trigger: { kind: 'timecode', tc: '00:10:00' },
      type: 'media.play',
      args: { target: 'media.pixera:/screen/main', clip: 'promo_20s.prores' },
    },
    {
      id: 'cue-marker-preview',
      beatId: 'beat-reset',
      priority: 30,
      trigger: { kind: 'state', when: 'cue-promo-spot:done' },
      type: 'previz.marker.show',
      args: { id: 'reset-marker', pos: { x: 2, y: 0, z: -3 }, label: 'Reset Loop' },
    },
  ],
  meta: { version: '1.0.0' },
}
