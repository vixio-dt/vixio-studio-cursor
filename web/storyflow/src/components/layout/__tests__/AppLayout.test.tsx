import { render, screen } from '@testing-library/react'
import { AppLayout } from '../AppLayout'
import { vi } from 'vitest'
import type { BoardState } from '@story/state/boardStore'

vi.mock('@story/state/boardStore', async () => {
  const actual = await import('@story/state/boardStore')
  return {
    ...actual,
    useBoardStore: (selector: (state: BoardState) => unknown) =>
      selector({
        view: 'flow',
        setView: vi.fn(),
        lastSaved: '2025-09-25T10:00:00.000Z',
        isDirty: false,
      } as BoardState),
  }
})

describe('AppLayout', () => {
  it('shows status label when last saved', () => {
    render(<AppLayout main={<div />} />)
    expect(screen.getByText(/Saved/)).toBeVisible()
  })
})
