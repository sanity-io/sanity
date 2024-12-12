import {render, within} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {activeASAPRelease} from '../../../__fixtures__/release.fixture'
import {releasesUsEnglishLocaleBundle} from '../../../i18n'
import {
  archivedReleaseEvents,
  publishedReleaseEvents,
  unarchivedReleaseEvents,
} from '../events/__fixtures__/release-events'
import {ReleaseStatusItems} from '../ReleaseStatusItems'

describe('ReleaseStatusItems', () => {
  it('renders fallback status item when no footer event is found', async () => {
    const wrapper = await createTestProvider({
      resources: [releasesUsEnglishLocaleBundle],
    })

    const component = render(<ReleaseStatusItems events={[]} release={activeASAPRelease} />, {
      wrapper,
    })
    const text = await component.findByText('Created')
    expect(text).toBeInTheDocument()
  })
  it('renders the creation event, when no any other relevant event is present', async () => {
    const wrapper = await createTestProvider({
      resources: [releasesUsEnglishLocaleBundle],
    })

    const component = render(
      <ReleaseStatusItems events={[publishedReleaseEvents[2]]} release={activeASAPRelease} />,
      {
        wrapper,
      },
    )
    const timeElement = await component.findByRole('time')
    expect(timeElement).toHaveAttribute('datetime', '2024-12-03T00:00:00.000Z')
    const text = await component.findByText('Created')
    expect(text).toBeInTheDocument()
  })
  it('renders a status item for a PublishRelease event and the create event', async () => {
    const wrapper = await createTestProvider({
      resources: [releasesUsEnglishLocaleBundle],
    })

    const component = render(
      <ReleaseStatusItems events={publishedReleaseEvents} release={activeASAPRelease} />,
      {
        wrapper,
      },
    )
    const publishEvent = await component.findByTestId('status-publishRelease')
    const timeElement = await within(publishEvent).findByRole('time')
    expect(timeElement).toHaveAttribute('datetime', '2024-12-05T00:00:00.000Z')
    const text = await within(publishEvent).findByText('Published')
    expect(text).toBeInTheDocument()

    const createEvent = await component.findByTestId('status-createRelease')
    expect(createEvent).toBeInTheDocument()
  })
  it('renders a status item for an ArchiveRelease event', async () => {
    const wrapper = await createTestProvider({
      resources: [releasesUsEnglishLocaleBundle],
    })

    const component = render(
      <ReleaseStatusItems events={archivedReleaseEvents} release={activeASAPRelease} />,
      {
        wrapper,
      },
    )
    const archivedEvent = await component.findByTestId('status-archiveRelease')

    const timeElement = await within(archivedEvent).findByRole('time')
    expect(timeElement).toHaveAttribute('datetime', '2024-12-05T00:00:00.000Z')
    const text = await within(archivedEvent).findByText('Archived')
    expect(text).toBeInTheDocument()

    const createEvent = await component.findByTestId('status-createRelease')
    expect(createEvent).toBeInTheDocument()
  })
  it('renders a status item for an UnarchiveRelease event', async () => {
    const wrapper = await createTestProvider({
      resources: [releasesUsEnglishLocaleBundle],
    })
    const component = render(
      <ReleaseStatusItems events={unarchivedReleaseEvents} release={activeASAPRelease} />,
      {
        wrapper,
      },
    )
    const unarchiveEvent = await component.findByTestId('status-unarchiveRelease')

    const timeElement = await within(unarchiveEvent).findByRole('time')
    expect(timeElement).toHaveAttribute('datetime', '2024-12-06T00:00:00.000Z')
    const text = await within(unarchiveEvent).findByText('Unarchived')
    expect(text).toBeInTheDocument()

    const createEvent = await component.findByTestId('status-createRelease')
    expect(createEvent).toBeInTheDocument()
  })
})
