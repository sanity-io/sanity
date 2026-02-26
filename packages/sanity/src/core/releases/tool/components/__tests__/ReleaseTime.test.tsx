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
  it('renders "As soon as possible" when releaseType is "asap"', async () => {
    await renderTest({release: activeASAPRelease})

    expect(screen.getByText('As soon as possible')).toBeInTheDocument()
  })

  it('renders "Undecided" when releaseType is "undecided"', async () => {
    await renderTest({release: activeUndecidedRelease})

    expect(screen.getByText('Undecided')).toBeInTheDocument()
  })

  it('renders the formatted date with timezone abbreviation when releaseType is scheduled', async () => {
    await renderTest({
      release: scheduledRelease,
    })

    expect(screen.getByText('Scheduled')).toBeInTheDocument()
    expect(screen.getByText('Oct 10, 2023', {exact: false})).toBeInTheDocument()
  })

  it('renders "Estimated" for active scheduled releases', async () => {
    await renderTest({
      release: activeScheduledRelease,
    })

    expect(screen.getByText('Estimated')).toBeInTheDocument()
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
