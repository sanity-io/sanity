import {render, screen, waitFor} from '@testing-library/react'
import {type ComponentProps} from 'react'
import {describe, expect, it, vi} from 'vitest'

import {getByDataUi} from '../../../../../../test/setup/customQueries'
import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {useTimeZoneMockReturn} from '../../../../hooks/__mocks__/useTimeZone.mock'
import {
  activeScheduledRelease,
  activeASAPRelease,
  activeUndecidedRelease,
  archivedScheduledRelease,
  scheduledRelease,
} from '../../../__fixtures__/release.fixture'
import {releasesUsEnglishLocaleBundle} from '../../../i18n'
import {type TableRelease} from '../../overview/ReleasesOverview'
import {ReleaseTime} from '../ReleaseTime'

vi.mock(
  '../../../hooks/useTimeZone',
  vi.fn(() => useTimeZoneMockReturn),
)

const renderTest = async (props: ComponentProps<typeof ReleaseTime>) => {
  const wrapper = await createTestProvider({
    resources: [releasesUsEnglishLocaleBundle],
  })

  const rendered = render(<ReleaseTime {...props} />, {wrapper})

  await waitFor(() => {
    expect(screen.queryByTestId('loading-block')).not.toBeInTheDocument()
  })

  return rendered
}

describe('ReleaseTime', () => {
  it('renders "Unscheduled" when releaseType is "asap" (no date)', async () => {
    await renderTest({release: activeASAPRelease})

    expect(screen.getByText('Unscheduled')).toBeInTheDocument()
  })

  it('renders "Unscheduled" when releaseType is "undecided" (no date)', async () => {
    await renderTest({release: activeUndecidedRelease})

    expect(screen.getByText('Unscheduled')).toBeInTheDocument()
  })

  it('renders a lock icon and the formatted date for armed (scheduled) releases', async () => {
    await renderTest({
      release: scheduledRelease,
    })

    expect(screen.getByTestId('release-lock-icon')).toBeInTheDocument()
    expect(screen.getByText('Oct 10, 2023', {exact: false})).toBeInTheDocument()
  })

  it('renders a caution glyph for active releases with an intended (not armed) date', async () => {
    await renderTest({
      release: activeScheduledRelease,
    })

    expect(screen.getByTestId('release-not-scheduled')).toBeInTheDocument()
  })

  it('renders the date without a schedule-status prefix for archived releases', async () => {
    await renderTest({
      release: archivedScheduledRelease,
    })

    expect(screen.queryByText('Not scheduled')).not.toBeInTheDocument()
    expect(screen.queryByText('Scheduled')).not.toBeInTheDocument()
    expect(screen.getByText('Oct 10, 2023', {exact: false})).toBeInTheDocument()
  })

  it('renders the date without "Estimated" prefix for published releases', async () => {
    await renderTest({
      release: {...archivedScheduledRelease, state: 'published' as const},
    })

    expect(screen.queryByText('Estimated')).not.toBeInTheDocument()
    expect(screen.queryByText('Scheduled')).not.toBeInTheDocument()
    expect(screen.getByText('Oct 10, 2023', {exact: false})).toBeInTheDocument()
  })

  it('renders nothing when releaseType is "scheduled" and publishDate is not available', async () => {
    await renderTest({
      release: {
        ...scheduledRelease,
        publishAt: undefined,
        publishedAt: undefined,
        metadata: {...scheduledRelease.metadata, intendedPublishAt: undefined},
      } as TableRelease,
    })

    expect(getByDataUi(document.body, 'ToastProvider')).toBeEmptyDOMElement()
  })
})
