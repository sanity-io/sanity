import {type ReleaseDocument} from '@sanity/client'
import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {type ComponentProps} from 'react'
import type * as SanityRouter from 'sanity/router'
import {beforeAll, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {mockUseTimeZone, useTimeZoneMockReturn} from '../../../../hooks/__mocks__/useTimeZone.mock'
import {
  activeASAPRelease,
  activeScheduledRelease,
  scheduledRelease,
} from '../../../__fixtures__/release.fixture'
import {releasesUsEnglishLocaleBundle} from '../../../i18n'
import {type TableRelease} from '../ReleasesOverview'
import {ReleaseTimeline} from '../ReleaseTimeline'

vi.mock('../../../../hooks/useTimeZone', () => ({
  useTimeZone: vi.fn(() => useTimeZoneMockReturn),
}))

const mockNavigate = vi.fn()
vi.mock('sanity/router', async (importOriginal) => {
  const actual = await importOriginal<typeof SanityRouter>()
  return {
    ...actual,
    useRouter: () => ({navigate: mockNavigate}),
  }
})

let wrapper: React.ComponentType<{children: React.ReactNode}>

beforeAll(async () => {
  wrapper = await createTestProvider({
    resources: [releasesUsEnglishLocaleBundle],
  })
})

// scheduledRelease: state 'scheduled' + publishAt set -> armed.
// activeScheduledRelease: intendedPublishAt set, but state 'active' (not armed) -> intended-not-armed.
// activeASAPRelease: no publishAt/intendedPublishAt at all -> undated, excluded from the timeline.
const datedArmed: TableRelease = {...scheduledRelease}
const datedIntended: TableRelease = {
  ...activeScheduledRelease,
  metadata: {
    ...activeScheduledRelease.metadata,
    intendedPublishAt: new Date().toISOString(),
  },
}
const undated: TableRelease = {...activeASAPRelease}

/** `createTestProvider`'s locale bundle resolves asynchronously — wait for the loading
 * placeholder to clear before asserting on rendered content, matching `ReleaseTime.test.tsx`. */
async function renderTimeline(props: ComponentProps<typeof ReleaseTimeline>) {
  const view = render(<ReleaseTimeline {...props} />, {wrapper})
  await waitFor(() => {
    expect(screen.queryByTestId('loading-block')).not.toBeInTheDocument()
  })
  return view
}

describe('ReleaseTimeline', () => {
  beforeAll(() => {
    mockUseTimeZone.mockReturnValue(useTimeZoneMockReturn)
  })

  it('renders nothing when there are no dated releases', async () => {
    await renderTimeline({releases: [undated]})
    expect(screen.queryByTestId('release-timeline')).not.toBeInTheDocument()
  })

  it('renders a pill for each dated release and excludes undated releases', async () => {
    await renderTimeline({releases: [datedArmed, datedIntended, undated]})

    expect(screen.getByTestId('release-timeline')).toBeInTheDocument()
    expect(screen.getByTestId(`release-timeline-pill-${datedArmed._id}`)).toBeInTheDocument()
    expect(screen.getByTestId(`release-timeline-pill-${datedIntended._id}`)).toBeInTheDocument()
    expect(screen.queryByTestId(`release-timeline-pill-${undated._id}`)).not.toBeInTheDocument()

    expect(screen.getByText(scheduledRelease.metadata.title)).toBeInTheDocument()
    expect(screen.getByText(activeScheduledRelease.metadata.title)).toBeInTheDocument()
  })

  it('renders a lock glyph for an armed release and a caution glyph for an intended-not-armed one', async () => {
    await renderTimeline({releases: [datedArmed, datedIntended]})

    const armedPill = screen.getByTestId(`release-timeline-pill-${datedArmed._id}`)
    expect(armedPill.querySelector('[data-sanity-icon="lock"]')).toBeInTheDocument()

    const intendedPill = screen.getByTestId(`release-timeline-pill-${datedIntended._id}`)
    expect(intendedPill.querySelector('[data-sanity-icon="warning-outline"]')).toBeInTheDocument()
  })

  it('respects the granularity toggle (defaults to Month, switches to Week/Quarter without losing pills)', async () => {
    await renderTimeline({releases: [datedArmed, datedIntended]})

    const weekButton = screen.getByTestId('release-timeline-granularity-week')
    await userEvent.click(weekButton)
    expect(screen.getByTestId(`release-timeline-pill-${datedArmed._id}`)).toBeInTheDocument()

    const quarterButton = screen.getByTestId('release-timeline-granularity-quarter')
    await userEvent.click(quarterButton)
    expect(screen.getByTestId(`release-timeline-pill-${datedArmed._id}`)).toBeInTheDocument()
  })

  it('collapses and expands the roadmap via the header toggle', async () => {
    await renderTimeline({releases: [datedArmed]})

    expect(screen.getByTestId(`release-timeline-pill-${datedArmed._id}`)).toBeInTheDocument()

    await userEvent.click(screen.getByTestId('release-timeline-toggle'))
    expect(screen.queryByTestId(`release-timeline-pill-${datedArmed._id}`)).not.toBeInTheDocument()
    expect(screen.queryByTestId('release-timeline-granularity-week')).not.toBeInTheDocument()

    await userEvent.click(screen.getByTestId('release-timeline-toggle'))
    expect(screen.getByTestId(`release-timeline-pill-${datedArmed._id}`)).toBeInTheDocument()
  })

  it('navigates to the release detail when a pill is clicked', async () => {
    mockNavigate.mockClear()
    await renderTimeline({releases: [datedArmed]})

    await userEvent.click(screen.getByTestId(`release-timeline-pill-${datedArmed._id}`))

    expect(mockNavigate).toHaveBeenCalledWith({releaseId: 'rScheduled'})
  })

  it('renders a diamond axis marker for each dated release', async () => {
    await renderTimeline({releases: [datedArmed, datedIntended]})

    expect(screen.getByTestId(`release-timeline-marker-${datedArmed._id}`)).toBeInTheDocument()
    expect(screen.getByTestId(`release-timeline-marker-${datedIntended._id}`)).toBeInTheDocument()
  })

  it('shows the Unscheduled chip counting releases excluded from the strip, hidden at zero', async () => {
    const {rerender} = await renderTimeline({releases: [datedArmed, undated]})

    expect(screen.getByTestId('release-timeline-unscheduled-chip')).toHaveTextContent(
      'Unscheduled: 1',
    )

    rerender(<ReleaseTimeline releases={[datedArmed, datedIntended]} />)
    expect(screen.queryByTestId('release-timeline-unscheduled-chip')).not.toBeInTheDocument()
  })

  it('truncates a very long release title to a single line instead of bleeding across the strip', async () => {
    const longTitleRelease: TableRelease = {
      ...scheduledRelease,
      _id: '_.releases.rLongTitle',
      metadata: {
        ...scheduledRelease.metadata,
        title:
          'This release title is just so obscenely long that it would otherwise stretch across the entire timeline strip and overlap every other pill in its lane',
      },
    }

    await renderTimeline({releases: [longTitleRelease]})

    const pill = screen.getByTestId(`release-timeline-pill-${longTitleRelease._id}`)
    expect(pill).toHaveStyle({width: '216px', maxWidth: '216px'})

    expect(pill.querySelector(`[title="${longTitleRelease.metadata.title}"]`)).toBeInTheDocument()
  })

  it('flags two releases publishing on the same calendar day as a collision', async () => {
    const sameDayA: ReleaseDocument = {
      ...scheduledRelease,
      _id: '_.releases.rSameDayA',
      publishAt: '2023-10-10T09:00:00Z',
    }
    const sameDayB: ReleaseDocument = {
      ...scheduledRelease,
      _id: '_.releases.rSameDayB',
      publishAt: '2023-10-10T14:00:00Z',
      metadata: {...scheduledRelease.metadata, title: 'same day release B'},
    }

    await renderTimeline({releases: [sameDayA as TableRelease, sameDayB as TableRelease]})

    const pillA = screen.getByTestId(`release-timeline-pill-${sameDayA._id}`)
    const pillB = screen.getByTestId(`release-timeline-pill-${sameDayB._id}`)
    expect(pillA).toHaveTextContent('Stagger')
    expect(pillB).toHaveTextContent('Stagger')
  })
})
