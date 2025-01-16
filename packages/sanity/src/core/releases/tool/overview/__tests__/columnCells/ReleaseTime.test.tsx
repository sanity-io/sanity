import {render, screen, waitFor} from '@testing-library/react'
import {format} from 'date-fns'
import {type ComponentProps} from 'react'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {useTimeZoneMockReturn} from '../../../../../scheduledPublishing/hooks/__tests__/__mocks__/useTimeZone.mock'
import {
  activeASAPRelease,
  activeUndecidedRelease,
  scheduledRelease,
} from '../../../../__fixtures__/release.fixture'
import {releasesUsEnglishLocaleBundle} from '../../../../i18n'
import {ReleaseTime} from '../../columnCells/ReleaseTime'
import {type TableRelease} from '../../ReleasesOverview'

vi.mock('../../../../scheduledPublishing/hooks/useTimeZone', () => useTimeZoneMockReturn)

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
  it('renders "ASAP" when releaseType is "asap"', async () => {
    await renderTest({release: activeASAPRelease})

    expect(screen.getByText('ASAP')).toBeInTheDocument()
  })

  it('renders "Undecided" when releaseType is "undecided"', async () => {
    await renderTest({release: activeUndecidedRelease})

    expect(screen.getByText('Undecided')).toBeInTheDocument()
  })

  it('renders the formatted date with timezone abbreviation when releaseType is scheduled', async () => {
    await renderTest({
      release: scheduledRelease,
    })

    expect(screen.getByText('Oct 10, 2023', {exact: false})).toBeInTheDocument()
  })

  it('renders nothing when releaseType is "scheduled" and publishDate is not available', async () => {
    await renderTest({
      release: {
        ...scheduledRelease,
        publishAt: undefined,
        metadata: {...scheduledRelease.metadata, intendedPublishAt: undefined},
      } as TableRelease,
    })

    const formattedDate = `${format(new Date(), 'PPpp')}`
    expect(screen.getByText(formattedDate, {exact: false})).toBeInTheDocument()
  })
})
