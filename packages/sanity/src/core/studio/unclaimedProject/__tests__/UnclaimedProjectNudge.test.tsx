import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {act, render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {type ReactNode} from 'react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {
  formatCountdown,
  UnclaimedProjectCountdown,
  UnclaimedProjectNudge,
} from '../UnclaimedProjectNudge'

const {
  mockClearUnclaimedProjectRecord,
  mockEnvironment,
  mockLogout,
  mockUseUnclaimedProject,
  mockUseUnclaimedProjectCopy,
  mockUseWorkspace,
} = vi.hoisted(() => ({
  mockClearUnclaimedProjectRecord: vi.fn(),
  mockEnvironment: {isDev: true},
  mockLogout: vi.fn(),
  mockUseUnclaimedProject: vi.fn(),
  mockUseUnclaimedProjectCopy: vi.fn(),
  mockUseWorkspace: vi.fn(),
}))

vi.mock('../../../store/authStore/unclaimedProjectStorage', async (importOriginal) => ({
  ...(await importOriginal()),
  clearUnclaimedProjectRecord: mockClearUnclaimedProjectRecord,
}))
vi.mock('../../../hooks/useConditionalToast', () => ({useConditionalToast: vi.fn()}))
vi.mock('../../../hooks/useDateTimeFormat', () => ({
  useDateTimeFormat: () => ({format: () => ''}),
}))
vi.mock('../../../hooks/useRelativeTime', () => ({useRelativeTime: () => ''}))
vi.mock('../../../environment', () => mockEnvironment)
vi.mock('../../workspace', () => ({useWorkspace: mockUseWorkspace}))
vi.mock('../useUnclaimedProject', async (importOriginal) => ({
  ...(await importOriginal()),
  useUnclaimedProject: mockUseUnclaimedProject,
}))
vi.mock('../useUnclaimedProjectCopy', async (importOriginal) => ({
  ...(await importOriginal()),
  useUnclaimedProjectCopy: mockUseUnclaimedProjectCopy,
}))

const theme = buildTheme()
const PROJECT_ID = 'test-project'
const COPY = {
  criticalThresholdHours: 12,
  snoozeMinutes: 60,
  banner: {
    text: 'Claim this project before {{expiresAt}}.',
    criticalText: 'Claim this project now.',
    claimButtonText: 'Claim project',
  },
  toast: {
    title: 'Claim this project.',
    criticalTitle: 'Claim this project now.',
    description: 'Keep everything you built.',
    claimButtonText: 'Claim project',
    snoozeButtonText: 'Remind me later',
  },
  claimed: {
    text: 'This project is yours.',
    identityText: 'Log in as {{identity}}.',
    signInButtonText: 'Log in',
  },
  noClaimUrl: {text: 'Open the original claim link.'},
}

const wrapper = ({children}: {children: ReactNode}) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
)

describe('UnclaimedProjectNudge', () => {
  afterEach(() => {
    mockEnvironment.isDev = true
    vi.clearAllMocks()
  })

  it('does not inspect the workspace outside development', () => {
    mockEnvironment.isDev = false

    render(<UnclaimedProjectNudge />, {wrapper})

    expect(mockUseWorkspace).not.toHaveBeenCalled()
    expect(mockUseUnclaimedProject).not.toHaveBeenCalled()
  })

  it('clears a stale claim record without running the project state check for human users', () => {
    mockUseWorkspace.mockReturnValue({
      currentUser: {provider: 'google'},
      projectId: PROJECT_ID,
    })

    render(<UnclaimedProjectNudge />, {wrapper})

    expect(mockClearUnclaimedProjectRecord).toHaveBeenCalledExactlyOnceWith(PROJECT_ID)
    expect(mockUseUnclaimedProject).not.toHaveBeenCalled()
  })

  it('does not clear claim records while the current user is unresolved', () => {
    mockUseWorkspace.mockReturnValue({currentUser: undefined, projectId: PROJECT_ID})

    render(<UnclaimedProjectNudge />, {wrapper})

    expect(mockClearUnclaimedProjectRecord).not.toHaveBeenCalled()
    expect(mockUseUnclaimedProject).not.toHaveBeenCalled()
  })

  it('clears claim provenance before leaving the post-claim robot session', async () => {
    mockUseWorkspace.mockReturnValue({
      auth: {logout: mockLogout},
      currentUser: {provider: 'sanity-token'},
      projectId: PROJECT_ID,
    })
    mockUseUnclaimedProject.mockReturnValue({
      status: 'claimed',
      email: 'claimant@example.com',
    })
    mockUseUnclaimedProjectCopy.mockReturnValue(COPY)

    render(<UnclaimedProjectNudge />, {wrapper})
    const [signInButton] = screen.getAllByRole('button', {name: 'Log in'})
    await userEvent.click(signInButton)

    expect(mockClearUnclaimedProjectRecord).toHaveBeenCalledExactlyOnceWith(PROJECT_ID)
    expect(mockLogout).toHaveBeenCalledOnce()
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
