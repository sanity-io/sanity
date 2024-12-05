import {render} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {activeASAPRelease} from '../../../__fixtures__/release.fixture'
import {releasesUsEnglishLocaleBundle} from '../../../i18n'
import {
  archivedReleaseEvents,
  publishedReleaseEvents,
  unarchivedReleaseEvents,
} from '../activity/__fixtures__/testHelpers'
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
  it('renders a status item for a PublishRelease event', async () => {
    const wrapper = await createTestProvider({
      resources: [releasesUsEnglishLocaleBundle],
    })

    const component = render(
      <ReleaseStatusItems events={publishedReleaseEvents} release={activeASAPRelease} />,
      {
        wrapper,
      },
    )
    const timeElement = await component.findByRole('time')
    expect(timeElement).toHaveAttribute('datetime', '2024-12-05T00:00:00.000Z')
    const text = await component.findByText('Published')
    expect(text).toBeInTheDocument()
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
    const timeElement = await component.findByRole('time')
    expect(timeElement).toHaveAttribute('datetime', '2024-12-05T00:00:00.000Z')
    const text = await component.findByText('Archived')
    expect(text).toBeInTheDocument()
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
    const timeElement = await component.findByRole('time')
    expect(timeElement).toHaveAttribute('datetime', '2024-12-06T00:00:00.000Z')
    const text = await component.findByText('Unarchived')
    expect(text).toBeInTheDocument()
  })
})
