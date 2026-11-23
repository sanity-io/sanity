import {type ReleaseDocument} from '@sanity/client'
import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {activeASAPRelease, activeScheduledRelease} from '../../../__fixtures__/release.fixture'
import {releasesUsEnglishLocaleBundle} from '../../../i18n'
import {CardinalityViewPicker} from '../CardinalityViewPicker'
import {type CardinalityView} from '../queryParamUtils'

const mockLog = vi.fn()

vi.mock('@sanity/telemetry/react', () => ({
  useTelemetry: vi.fn(() => ({log: mockLog})),
}))

const cardinalityOneRelease: ReleaseDocument = {
  ...activeScheduledRelease,
  metadata: {...activeScheduledRelease.metadata, cardinality: 'one'},
}

const cardinalityManyRelease: ReleaseDocument = {
  ...activeASAPRelease,
  metadata: {...activeASAPRelease.metadata, cardinality: 'many'},
}

let wrapper: React.ComponentType<{children: React.ReactNode}>

beforeAll(async () => {
  wrapper = await createTestProvider({
    resources: [releasesUsEnglishLocaleBundle],
  })
})

const renderPicker = ({
  cardinalityView = 'releases',
  allReleases = [cardinalityOneRelease, cardinalityManyRelease],
  onCardinalityViewChange = vi.fn(() => vi.fn()),
}: {
  cardinalityView?: CardinalityView
  allReleases?: ReleaseDocument[]
  onCardinalityViewChange?: (view: CardinalityView) => () => void
} = {}) => {
  return {
    onCardinalityViewChange,
    ...render(
      <CardinalityViewPicker
        cardinalityView={cardinalityView}
        loading={false}
        isScheduledDraftsEnabled
        isDraftModelEnabled
        isReleasesEnabled
        allReleases={allReleases}
        onCardinalityViewChange={onCardinalityViewChange}
      />,
      {wrapper},
    ),
  }
}

describe('CardinalityViewPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders three tabs — All, Releases, Scheduled drafts — in that order when both cardinalities are present', async () => {
    renderPicker({cardinalityView: 'releases'})

    await screen.findByText('All')
    const buttons = screen.getAllByRole('button')
    expect(buttons.map((button) => button.textContent)).toEqual([
      'All',
      'Releases',
      'Scheduled drafts',
    ])
  })

  it('marks the "All" tab as selected when cardinalityView is "all"', async () => {
    renderPicker({cardinalityView: 'all'})

    await screen.findByText('All')
    const [allButton, releasesButton, draftsButton] = screen.getAllByRole('button')

    expect(allButton).toHaveAttribute('data-selected')
    expect(releasesButton).not.toHaveAttribute('data-selected')
    expect(draftsButton).not.toHaveAttribute('data-selected')
  })

  it('calls onCardinalityViewChange with "all" when the All tab is clicked', async () => {
    const innerHandler = vi.fn()
    const onCardinalityViewChange = vi.fn(() => innerHandler)

    renderPicker({cardinalityView: 'releases', onCardinalityViewChange})

    await userEvent.click(await screen.findByText('All'))

    expect(onCardinalityViewChange).toHaveBeenCalledWith('all')
    expect(innerHandler).toHaveBeenCalledTimes(1)
  })

  it('logs a telemetry event when navigating to the All view', async () => {
    renderPicker({cardinalityView: 'releases'})

    await userEvent.click(await screen.findByText('All'))

    expect(mockLog).toHaveBeenCalledWith(
      expect.objectContaining({name: 'Navigated to All Releases'}),
      {source: 'view-picker'},
    )
  })

  it('logs a telemetry event when navigating to the Releases view', async () => {
    renderPicker({cardinalityView: 'all'})

    await userEvent.click(await screen.findByText('Releases'))

    expect(mockLog).toHaveBeenCalledWith(
      expect.objectContaining({name: 'Navigated to Content Releases'}),
      {source: 'view-picker'},
    )
  })

  it('logs a telemetry event when navigating to the Scheduled drafts view', async () => {
    renderPicker({cardinalityView: 'all'})

    await userEvent.click(await screen.findByText('Scheduled drafts'))

    expect(mockLog).toHaveBeenCalledWith(
      expect.objectContaining({name: 'Navigated to Scheduled Drafts'}),
      {source: 'view-picker'},
    )
  })
})
