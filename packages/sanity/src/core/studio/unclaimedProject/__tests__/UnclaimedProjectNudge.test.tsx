import {studioTheme, ThemeProvider} from '@sanity/ui'
import {act, render, screen} from '@testing-library/react'
import {type ReactNode} from 'react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {
  formatCountdown,
  UnclaimedProjectCountdown,
  UnclaimedProjectNudge,
} from '../UnclaimedProjectNudge'

const {mockUseUnclaimedProject, mockUseWorkspace} = vi.hoisted(() => ({
  mockUseUnclaimedProject: vi.fn(),
  mockUseWorkspace: vi.fn(),
}))

vi.mock('../../workspace', () => ({useWorkspace: mockUseWorkspace}))
vi.mock('../useUnclaimedProject', () => ({useUnclaimedProject: mockUseUnclaimedProject}))

const wrapper = ({children}: {children: ReactNode}) => (
  <ThemeProvider theme={studioTheme}>{children}</ThemeProvider>
)

describe('UnclaimedProjectNudge', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('does not run the project state check for non-robot users', () => {
    mockUseWorkspace.mockReturnValue({currentUser: {provider: 'google'}})

    render(<UnclaimedProjectNudge />, {wrapper})

    expect(mockUseUnclaimedProject).not.toHaveBeenCalled()
  })
})

describe('UnclaimedProjectCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-28T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('ticks once per second with stable-width hours, minutes, and seconds', async () => {
    const expiresAt = new Date('2026-07-28T13:00:00.000Z')
    render(<UnclaimedProjectCountdown critical={false} expiresAt={expiresAt} />, {wrapper})
    const countdown = screen.getByTestId('unclaimed-project-countdown')

    expect(countdown).toHaveTextContent('01:00:00')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000)
    })

    expect(countdown).toHaveTextContent('00:59:59')
  })
})

describe('formatCountdown', () => {
  it('keeps durations over 24 hours in the hours position', () => {
    const now = new Date('2026-07-28T12:00:00.000Z').getTime()
    const expiresAt = new Date(now + (62 * 3_600 + 18 * 60 + 5) * 1_000)

    expect(formatCountdown(expiresAt, now)).toBe('62:18:05')
  })

  it('clamps an elapsed countdown at zero', () => {
    const now = new Date('2026-07-28T12:00:00.000Z').getTime()

    expect(formatCountdown(new Date(now - 1_000), now)).toBe('00:00:00')
  })
})
