import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {act, render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {type ReactNode} from 'react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {writeUnclaimedProjectSnoozedAt} from '../../../store/authStore/unclaimedProjectStorage'
import {
  formatCountdown,
  UnclaimedProjectCountdown,
  UnclaimedProjectNudge,
} from '../UnclaimedProjectNudge'

const {
  mockClearUnclaimedProjectRecord,
  mockEnvironment,
  mockLogout,
  mockUseConditionalToast,
  mockUseUnclaimedProject,
  mockUseUnclaimedProjectCopy,
  mockUseWorkspace,
} = vi.hoisted(() => ({
  mockClearUnclaimedProjectRecord: vi.fn(),
  mockEnvironment: {isDev: true},
  mockLogout: vi.fn(),
  mockUseConditionalToast: vi.fn(),
  mockUseUnclaimedProject: vi.fn(),
  mockUseUnclaimedProjectCopy: vi.fn(),
  mockUseWorkspace: vi.fn(),
}))

vi.mock('../../../store/authStore/unclaimedProjectStorage', async (importOriginal) => ({
  ...(await importOriginal()),
  clearUnclaimedProjectRecord: mockClearUnclaimedProjectRecord,
}))
vi.mock('../../../hooks/useConditionalToast', () => ({
  useConditionalToast: mockUseConditionalToast,
}))
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

function renderNudge(
  state:
    | {status: 'claimed'; email?: string}
    | {status: 'expired'}
    | {
        status: 'unclaimed'
        claimUrl: string | undefined
        expiresAt: Date
        claimLinkSpent?: boolean
      },
  copy: typeof COPY | null = COPY,
) {
  mockUseWorkspace.mockReturnValue({
    auth: {logout: mockLogout},
    currentUser: {provider: 'sanity-token'},
    projectId: PROJECT_ID,
  })
  mockUseUnclaimedProject.mockReturnValue(state)
  mockUseUnclaimedProjectCopy.mockReturnValue(copy ?? undefined)

  return render(<UnclaimedProjectNudge />, {wrapper})
}

function latestToast(): Record<string, unknown> {
  return mockUseConditionalToast.mock.calls.at(-1)?.[0] as Record<string, unknown>
}

describe('UnclaimedProjectNudge', () => {
  beforeEach(() => {
    localStorage.clear()
  })

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

  it('renders nothing while the project lifecycle is unresolved', () => {
    mockUseWorkspace.mockReturnValue({
      auth: {logout: mockLogout},
      currentUser: {provider: 'sanity-token'},
      projectId: PROJECT_ID,
    })
    mockUseUnclaimedProject.mockReturnValue(undefined)

    render(<UnclaimedProjectNudge />, {wrapper})

    expect(screen.queryByTestId('unclaimed-project-banner')).not.toBeInTheDocument()
    expect(mockUseUnclaimedProjectCopy).not.toHaveBeenCalled()
  })

  it('renders the normal claim banner and warning toast with a safe claim action', () => {
    const claimUrl = 'https://www.sanity.io/manage/claim/claim-token'
    renderNudge({
      status: 'unclaimed',
      claimUrl,
      expiresAt: new Date(Date.now() + 24 * 3_600_000),
      claimLinkSpent: false,
    })

    const banner = screen.getByTestId('unclaimed-project-banner')
    expect(banner).toHaveTextContent('Claim this project before .')
    expect(banner).toHaveAttribute('data-tone', 'caution')
    const claimLink = screen.getByRole('link', {name: 'Claim project'})
    expect(claimLink).toHaveAttribute('href', claimUrl)
    expect(claimLink).toHaveAttribute('target', '_blank')
    expect(claimLink).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getByTestId('unclaimed-project-launch-icon')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
    expect(screen.getByTestId('unclaimed-project-launch-icon')).toHaveAttribute(
      'focusable',
      'false',
    )
    expect(latestToast()).toMatchObject({enabled: true, status: 'warning'})
  })

  it('renders critical copy and an error toast inside the urgency threshold', () => {
    renderNudge({
      status: 'unclaimed',
      claimUrl: 'https://www.sanity.io/manage/claim/claim-token',
      expiresAt: new Date(Date.now() + 60_000),
      claimLinkSpent: false,
    })

    const banner = screen.getByTestId('unclaimed-project-banner')
    expect(banner).toHaveTextContent('Claim this project now.')
    expect(banner).toHaveAttribute('data-tone', 'critical')
    expect(latestToast()).toMatchObject({enabled: true, status: 'error'})
  })

  it('starts claim polling when the Studio claim action is opened', async () => {
    renderNudge({
      status: 'unclaimed',
      claimUrl: 'https://www.sanity.io/manage/claim/claim-token',
      expiresAt: new Date(Date.now() + 24 * 3_600_000),
      claimLinkSpent: false,
    })

    await userEvent.click(screen.getByRole('link', {name: 'Claim project'}))

    expect(mockUseUnclaimedProject).toHaveBeenLastCalledWith({claimAttemptedAt: expect.any(Number)})
  })

  it('renders recovery copy instead of a claim action when no claim URL was received', () => {
    renderNudge({
      status: 'unclaimed',
      claimUrl: undefined,
      expiresAt: new Date(Date.now() + 24 * 3_600_000),
      claimLinkSpent: false,
    })

    expect(screen.getByTestId('unclaimed-project-banner')).toHaveTextContent(
      'Open the original claim link.',
    )
    expect(screen.queryByRole('link', {name: 'Claim project'})).not.toBeInTheDocument()

    render(<>{latestToast().description as ReactNode}</>, {wrapper})
    expect(screen.getAllByText('Open the original claim link.')).toHaveLength(2)
    expect(screen.queryByRole('link', {name: 'Claim project'})).not.toBeInTheDocument()
  })

  it('retires a spent claim action without mislabeling the working project as expired', () => {
    renderNudge({
      status: 'unclaimed',
      claimUrl: undefined,
      expiresAt: new Date(Date.now() + 24 * 3_600_000),
      claimLinkSpent: true,
    })

    expect(screen.getByTestId('unclaimed-project-banner')).not.toHaveTextContent(
      'Open the original claim link.',
    )
    expect(screen.queryByRole('link', {name: 'Claim project'})).not.toBeInTheDocument()

    render(<>{latestToast().description as ReactNode}</>, {wrapper})
    expect(screen.getByText('Keep everything you built.')).toBeInTheDocument()
    expect(screen.queryByRole('link', {name: 'Claim project'})).not.toBeInTheDocument()
  })

  it('snoozes only the toast while keeping the persistent banner', async () => {
    renderNudge({
      status: 'unclaimed',
      claimUrl: 'https://www.sanity.io/manage/claim/claim-token',
      expiresAt: new Date(Date.now() + 24 * 3_600_000),
      claimLinkSpent: false,
    })
    render(<>{latestToast().description as ReactNode}</>, {wrapper})

    await userEvent.click(screen.getByRole('button', {name: 'Remind me later'}))

    expect(latestToast()).toMatchObject({enabled: false})
    expect(screen.getByTestId('unclaimed-project-banner')).toBeInTheDocument()
  })

  it('shows the toast again after the configured snooze interval', () => {
    writeUnclaimedProjectSnoozedAt(
      PROJECT_ID,
      new Date(Date.now() - (COPY.snoozeMinutes + 1) * 60_000).toISOString(),
    )

    renderNudge({
      status: 'unclaimed',
      claimUrl: 'https://www.sanity.io/manage/claim/claim-token',
      expiresAt: new Date(Date.now() + 24 * 3_600_000),
      claimLinkSpent: false,
    })

    expect(latestToast()).toMatchObject({enabled: true})
  })

  it('renders the claimant identity when the project has been claimed', () => {
    renderNudge({status: 'claimed', email: 'claimant@example.com'})

    const banner = screen.getByTestId('unclaimed-project-banner')
    expect(banner).toHaveTextContent('This project is yours.')
    expect(banner).toHaveAttribute('data-tone', 'positive')
    expect(screen.getAllByText('claimant@example.com')).toHaveLength(2)
    expect(latestToast()).toMatchObject({enabled: false})
  })

  it('renders a generic claimed identity when the claimant cannot be resolved', () => {
    renderNudge({status: 'claimed'})

    expect(screen.getByTestId('unclaimed-project-banner')).toHaveTextContent(
      'Log in as the account tied to this project.',
    )
  })

  it('renders no stale banner for an expired project', () => {
    renderNudge({status: 'expired'})

    expect(screen.queryByTestId('unclaimed-project-banner')).not.toBeInTheDocument()
    expect(latestToast()).toMatchObject({enabled: false})
  })

  it('renders no partial UI while managed copy is unavailable', () => {
    renderNudge(
      {
        status: 'unclaimed',
        claimUrl: 'https://www.sanity.io/manage/claim/claim-token',
        expiresAt: new Date(Date.now() + 24 * 3_600_000),
        claimLinkSpent: false,
      },
      null,
    )

    expect(screen.queryByTestId('unclaimed-project-banner')).not.toBeInTheDocument()
    expect(latestToast()).toMatchObject({enabled: false})
  })

  it('clears claim provenance before leaving the post-claim robot session', async () => {
    renderNudge({status: 'claimed', email: 'claimant@example.com'})
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
