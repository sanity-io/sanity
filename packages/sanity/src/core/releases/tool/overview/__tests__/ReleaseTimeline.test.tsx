import {type ReleaseDocument} from '@sanity/client'
import {render, screen, waitFor, within} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {format} from 'date-fns/format'
import {startOfMonth} from 'date-fns/startOfMonth'
import {startOfWeek} from 'date-fns/startOfWeek'
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

/** An instant `days` from now, so fixtures land inside the timeline's default window (which is
 * bounded around "now"); the static fixture dates (2023) fall outside it and would be pulled into
 * the edge overflow chips instead of rendering as pills. */
const daysFromNow = (days: number, hour = 10) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

// scheduledRelease: state 'scheduled' + publishAt set -> armed.
// activeScheduledRelease: intendedPublishAt set, but state 'active' (not armed) -> intended-not-armed.
// activeASAPRelease: no publishAt/intendedPublishAt at all -> undated, excluded from the timeline.
const datedArmed: TableRelease = {...scheduledRelease, publishAt: daysFromNow(3)}
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

    // Each pill also carries its title in a (closed, still mounted) tooltip, so scope to the pill.
    expect(
      within(screen.getByTestId(`release-timeline-pill-${datedArmed._id}`)).getByText(
        scheduledRelease.metadata.title,
      ),
    ).toBeInTheDocument()
    expect(
      within(screen.getByTestId(`release-timeline-pill-${datedIntended._id}`)).getByText(
        activeScheduledRelease.metadata.title,
      ),
    ).toBeInTheDocument()
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

    const body = screen.getByTestId('release-timeline-body')
    expect(body).toHaveAttribute('aria-hidden', 'false')

    // Collapse animates via CSS (content stays mounted but clipped + aria-hidden); the zoom control
    // — meaningless without the axis — unmounts.
    await userEvent.click(screen.getByTestId('release-timeline-toggle'))
    expect(body).toHaveAttribute('aria-hidden', 'true')
    expect(screen.queryByTestId('release-timeline-granularity-week')).not.toBeInTheDocument()

    await userEvent.click(screen.getByTestId('release-timeline-toggle'))
    expect(body).toHaveAttribute('aria-hidden', 'false')
    expect(screen.getByTestId('release-timeline-granularity-week')).toBeInTheDocument()
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
      publishAt: daysFromNow(4),
      metadata: {
        ...scheduledRelease.metadata,
        title:
          'This release title is just so obscenely long that it would otherwise stretch across the entire timeline strip and overlap every other pill in its lane',
      },
    }

    await renderTimeline({releases: [longTitleRelease]})

    const pill = screen.getByTestId(`release-timeline-pill-${longTitleRelease._id}`)
    // Fixed pill width is the anti-bleed guarantee: the title can't stretch the pill.
    expect(pill).toHaveStyle({width: '240px', maxWidth: '240px'})
    // The title still renders in full (the ellipsis is a CSS clip; the text node is intact, and
    // the full text is surfaced by the pill's tooltip).
    expect(pill).toHaveTextContent(longTitleRelease.metadata.title)
  })

  it('renders a far-past dated release on the same continuous axis (no window-rescale) and exposes a Today anchor', async () => {
    // The timeline spans the full range of dated releases, so a release dated months ago is a
    // pill on the same continuous, scrollable axis — not clamped off or hidden behind a rescale.
    const farPast: TableRelease = {
      ...scheduledRelease,
      _id: '_.releases.rFarPast',
      publishAt: daysFromNow(-120),
    }

    await renderTimeline({releases: [farPast, datedArmed]})

    expect(screen.getByTestId(`release-timeline-pill-${datedArmed._id}`)).toBeInTheDocument()
    expect(screen.getByTestId(`release-timeline-pill-${farPast._id}`)).toBeInTheDocument()

    // The Today button (the scroll home-anchor) is always present.
    expect(screen.getByTestId('release-timeline-today')).toBeInTheDocument()
  })

  it('switches to a compact diamonds-only view (pills hidden, markers stay) and back', async () => {
    await renderTimeline({releases: [datedArmed, datedIntended]})

    // Defaults to detailed: pills present.
    expect(screen.getByTestId(`release-timeline-pill-${datedArmed._id}`)).toBeInTheDocument()

    // Compact: pills gone, diamonds remain.
    await userEvent.click(screen.getByTestId('release-timeline-density-compact'))
    expect(screen.queryByTestId(`release-timeline-pill-${datedArmed._id}`)).not.toBeInTheDocument()
    expect(screen.getByTestId(`release-timeline-marker-${datedArmed._id}`)).toBeInTheDocument()

    // Back to detailed: pills return.
    await userEvent.click(screen.getByTestId('release-timeline-density-detailed'))
    expect(screen.getByTestId(`release-timeline-pill-${datedArmed._id}`)).toBeInTheDocument()
  })

  it('keeps the strip a fixed height regardless of how many pills stack', async () => {
    await renderTimeline({releases: [datedArmed, datedIntended]})
    expect(screen.getByTestId('release-timeline-track')).toHaveStyle({height: '196px'})
  })

  it('renders two same-day releases as ordinary neighbours (same-day is not a conflict)', async () => {
    const sameDayA: ReleaseDocument = {
      ...scheduledRelease,
      _id: '_.releases.rSameDayA',
      publishAt: daysFromNow(6, 9),
    }
    const sameDayB: ReleaseDocument = {
      ...scheduledRelease,
      _id: '_.releases.rSameDayB',
      publishAt: daysFromNow(6, 14),
      metadata: {...scheduledRelease.metadata, title: 'same day release B'},
    }

    await renderTimeline({releases: [sameDayA as TableRelease, sameDayB as TableRelease]})

    // Both render; there's no collision/"Stagger" marking — publishing on the same day is normal.
    const pillA = screen.getByTestId(`release-timeline-pill-${sameDayA._id}`)
    const pillB = screen.getByTestId(`release-timeline-pill-${sameDayB._id}`)
    expect(pillA).not.toHaveAttribute('data-collides')
    expect(pillB).not.toHaveAttribute('data-collides')
  })

  describe('as navigation for the date filter', () => {
    // The mocked time zone is the identity, so the current month's column starts on its first day.
    const thisMonth = startOfMonth(new Date())
    const thisMonthName = `Show releases in ${format(thisMonth, 'MMMM yyyy')}`

    it('keeps the column headings as plain text when it has no filter handler', async () => {
      await renderTimeline({releases: [datedArmed, datedIntended]})
      expect(screen.queryByRole('button', {name: thisMonthName})).not.toBeInTheDocument()
    })

    it('makes each month heading a toggle button that selects its range', async () => {
      const onSelectDateFilter = vi.fn()
      await renderTimeline({releases: [datedArmed, datedIntended], onSelectDateFilter})

      const heading = screen.getByRole('button', {name: thisMonthName})
      expect(heading).toHaveAttribute('aria-pressed', 'false')
      expect(screen.queryByTestId('release-timeline-selected-range')).not.toBeInTheDocument()

      await userEvent.click(heading)
      expect(onSelectDateFilter).toHaveBeenCalledWith({
        kind: 'range',
        unit: 'month',
        start: thisMonth,
      })
    })

    it('shows the active range as pressed and highlighted on the axis', async () => {
      await renderTimeline({
        releases: [datedArmed, datedIntended],
        onSelectDateFilter: vi.fn(),
        dateFilter: {kind: 'range', unit: 'month', start: thisMonth},
      })

      expect(screen.getByRole('button', {name: thisMonthName})).toHaveAttribute(
        'aria-pressed',
        'true',
      )
      expect(screen.getByTestId('release-timeline-selected-range')).toBeInTheDocument()
    })

    it('does not highlight a column for a single day picked in the calendar', async () => {
      await renderTimeline({
        releases: [datedArmed, datedIntended],
        onSelectDateFilter: vi.fn(),
        dateFilter: {kind: 'range', unit: 'day', start: thisMonth},
      })
      expect(screen.queryByTestId('release-timeline-selected-range')).not.toBeInTheDocument()
    })

    it('selects weeks in the Week zoom', async () => {
      const onSelectDateFilter = vi.fn()
      await renderTimeline({releases: [datedArmed, datedIntended], onSelectDateFilter})
      await userEvent.click(screen.getByTestId('release-timeline-granularity-week'))

      const thisWeek = startOfWeek(new Date(), {weekStartsOn: 1})
      await userEvent.click(
        screen.getByRole('button', {name: `Show releases in week of ${format(thisWeek, 'd MMM')}`}),
      )
      expect(onSelectDateFilter).toHaveBeenCalledWith({
        kind: 'range',
        unit: 'week',
        start: thisWeek,
      })
    })

    it('makes the Unscheduled chip a toggle for releases with no date', async () => {
      const onSelectDateFilter = vi.fn()
      const {rerender} = await renderTimeline({
        releases: [datedArmed, undated],
        onSelectDateFilter,
      })

      const chip = screen.getByRole('button', {name: 'Unscheduled: 1'})
      expect(chip).toHaveAttribute('aria-pressed', 'false')
      await userEvent.click(chip)
      expect(onSelectDateFilter).toHaveBeenCalledWith({kind: 'unscheduled'})

      rerender(
        <ReleaseTimeline
          releases={[datedArmed, undated]}
          onSelectDateFilter={onSelectDateFilter}
          dateFilter={{kind: 'unscheduled'}}
        />,
      )
      expect(screen.getByRole('button', {name: 'Unscheduled: 1'})).toHaveAttribute(
        'aria-pressed',
        'true',
      )
    })
  })
})
