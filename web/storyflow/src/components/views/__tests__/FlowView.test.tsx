import { render, screen } from '@testing-library/react'
import { FlowView } from '../FlowView'
import { mockStory } from '../../../data/mockStory'
import { vi } from 'vitest'
import type { BoardState } from '@story/state/boardStore'

vi.mock('@story/state/boardStore', async () => {
  const actual = await import('@story/state/boardStore')
  return {
    ...actual,
    useBoardStore: (selector: (state: BoardState) => unknown) =>
      selector({
        beats: mockStory.beats,
        cues: mockStory.cues,
        selectedBeatId: mockStory.beats[0].id,
        selectBeat: vi.fn(),
        view: 'flow',
        setView: vi.fn(),
        lastSaved: null,
        isDirty: false,
      } as BoardState),
  }
})

describe('FlowView', () => {
  it('renders beat nodes with titles', () => {
    render(<FlowView />)
    for (const beat of mockStory.beats) {
      expect(screen.getByText(beat.title)).toBeInTheDocument()
    }
  })
})
