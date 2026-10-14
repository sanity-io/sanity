import {type ReactNode, useMemo, useState} from 'react'
import {UnclaimedProjectContext} from 'sanity/_singletons'
import {afterEach, beforeEach, expect, it, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {createMockSanityClientAsClient} from '../../../../../test/mocks/mockSanityClient'
import {LocaleProvider} from '../../../i18n/components/LocaleProvider'
import {clearUnclaimedProjectSnooze} from '../../../store/auth/legacy/unclaimedProjectStorage'
import {SourceProvider} from '../../source'
import {useWorkspace, WorkspaceProvider} from '../../workspace'
import {UnclaimedProjectNudge} from '../UnclaimedProjectNudge'
import {ROBOT_PROVIDER, type UnclaimedProjectState} from '../useUnclaimedProject'

const {settleChromaticEndState} = testHelpers()

// Freezing `Date` pins the countdown and critical-window math, but
// `Intl.DateTimeFormat` still uses the host timezone for `expiresAt`. Force
// UTC here so Chromatic archives the same banner text in every environment.
vi.mock('../../../hooks/useDateTimeFormat', () => ({
  useDateTimeFormat: (options: Intl.DateTimeFormatOptions = {}) =>
    new Intl.DateTimeFormat('en-US', {...options, timeZone: 'UTC'}),
}))

// The nudge formats `expiresAt`, counts down to it every second and reads the
// clock to decide whether the window is critical, so the test pins `Date` to a
// fixed instant (far enough out that the window cannot expire while it runs).
// Timers stay real: the countdown badge and the toast's one-second clock keep
// ticking, but every read of the frozen clock produces the same value.
const NOW = new Date('2030-03-10T12:00:00.000Z')
const HOUR_MS = 3_600_000
const OPEN_EXPIRES_AT = new Date(NOW.getTime() + 24 * HOUR_MS)
const OPEN_EXPIRES_AT_TEXT = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
}).format(OPEN_EXPIRES_AT)

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
  noClaimUrl: {text: 'Open the original claim link.'},
}

beforeEach(() => {
  clearUnclaimedProjectSnooze('test')
  vi.useFakeTimers({toFake: ['Date']})
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

/**
 * The nudge only renders for a robot (`sanity-token`) session and reads its
 * copy through the workspace client, so the harness re-provides the mock
 * workspace with a robot user and a client that answers the Journey copy
 * request from the fixture. `LocaleProvider` is what the date formatting hooks
 * need and what the studio shell provides above the nudge.
 */
function UnclaimedProjectNudgeHarness({state}: {state: UnclaimedProjectState}) {
  const workspace = useWorkspace()
  const source = workspace.unstable_sources[0]
  const [copyClient] = useState(() =>
    createMockSanityClientAsClient({requests: {'/journey/unclaimed-project': COPY}}),
  )
  const robotWorkspace = useMemo(
    () => ({
      ...workspace,
      currentUser: workspace.currentUser && {...workspace.currentUser, provider: ROBOT_PROVIDER},
    }),
    [workspace],
  )
  const copySource = useMemo(() => ({...source, getClient: () => copyClient}), [copyClient, source])
  const contextValue = useMemo(() => ({onClaim: () => undefined, state}), [state])

  return (
    <WorkspaceProvider workspace={robotWorkspace}>
      <SourceProvider source={copySource}>
        <LocaleProvider>
          <UnclaimedProjectContext.Provider value={contextValue}>
            <UnclaimedProjectNudge />
          </UnclaimedProjectContext.Provider>
        </LocaleProvider>
      </SourceProvider>
    </WorkspaceProvider>
  )
}

function renderNudge(state: UnclaimedProjectState): Promise<unknown> {
  return render(
    <TestWrapper schemaTypes={[]}>
      <UnclaimedProjectNudgeHarness state={state} />
    </TestWrapper>,
  )
}

/**
 * `useConditionalToast` enables its toast once its one-second clock has moved
 * past the instant the condition became true. With `Date` frozen that never
 * happens on its own, so step the frozen clock forward by a second once the
 * banner (and with it the condition) is up; the next real tick then pushes the
 * toast. The countdown reads the same clock, so it settles one second later too.
 */
async function stepClockPastToastDelay(): Promise<void> {
  await expect.element(page.getByTestId('unclaimed-project-banner')).toBeVisible()
  vi.setSystemTime(new Date(NOW.getTime() + 1_000))
}

async function expectBanner(text: string, countdown: string): Promise<Element> {
  const banner = page.getByTestId('unclaimed-project-banner')
  await expect.element(banner.getByText(text)).toBeVisible()
  await expect
    .element(banner.getByTestId('unclaimed-project-countdown'))
    .toHaveTextContent(countdown)
  return banner.element()
}

it('renders the caution banner and warning toast while the claim window is open', async () => {
  await renderNudge({
    status: 'unclaimed',
    claimUrl: 'https://www.sanity.io/claim/fixture-token',
    expiresAt: OPEN_EXPIRES_AT,
    claimLinkSpent: false,
  })
  await stepClockPastToastDelay()

  const banner = await expectBanner(
    `Claim this project before ${OPEN_EXPIRES_AT_TEXT}.`,
    '23:59:59',
  )
  expect(banner).toHaveAttribute('data-tone', 'caution')
  await expect.element(page.getByText('Keep everything you built.')).toBeVisible()
  await expect.element(page.getByRole('button', {name: 'Remind me later'})).toBeEnabled()
  // Banner and toast each carry a claim link.
  await expect.poll(() => page.getByRole('link', {name: 'Claim project'}).elements().length).toBe(2)

  await settleChromaticEndState()
})

it('switches the banner and toast to critical inside the critical threshold', async () => {
  await renderNudge({
    status: 'unclaimed',
    claimUrl: 'https://www.sanity.io/claim/fixture-token',
    expiresAt: new Date(NOW.getTime() + HOUR_MS),
    claimLinkSpent: false,
  })
  await stepClockPastToastDelay()

  const banner = await expectBanner('Claim this project now.', '00:59:59')
  expect(banner).toHaveAttribute('data-tone', 'critical')
  await expect.element(page.getByText('Keep everything you built.')).toBeVisible()
  await expect.poll(() => page.getByText('Claim this project now.').elements().length).toBe(2)

  await settleChromaticEndState()
})

it('points at the original claim link when the claim URL is unknown', async () => {
  await renderNudge({
    status: 'unclaimed',
    claimUrl: undefined,
    expiresAt: OPEN_EXPIRES_AT,
    claimLinkSpent: false,
  })
  await stepClockPastToastDelay()

  await expectBanner(`Claim this project before ${OPEN_EXPIRES_AT_TEXT}.`, '23:59:59')
  // Banner and toast both fall back to the no-claim-URL copy, with no claim button.
  await expect.poll(() => page.getByText('Open the original claim link.').elements().length).toBe(2)
  await expect.poll(() => page.getByRole('link', {name: 'Claim project'}).elements().length).toBe(0)

  await settleChromaticEndState()
})
