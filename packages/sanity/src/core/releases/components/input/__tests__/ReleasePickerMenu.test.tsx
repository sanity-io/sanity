import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {
  activeASAPRelease,
  activeScheduledRelease,
  archivedScheduledRelease,
  publishedASAPRelease,
} from '../../../__fixtures__/release.fixture'
import {releasesUsEnglishLocaleBundle} from '../../../i18n'
import {ReleasePickerMenu} from '../ReleasePickerMenu'

vi.mock('../../../store/useAllReleases', () => ({
  useAllReleases: vi.fn(() => mockUseAllReleasesReturn),
}))

let mockUseAllReleasesReturn: {
  data: (typeof activeASAPRelease)[]
  error?: Error
  loading: boolean
} = {
  data: [],
  error: undefined,
  loading: false,
}

describe('ReleasePickerMenu', () => {
  it('should only show active releases', async () => {
    mockUseAllReleasesReturn = {
      data: [activeASAPRelease, archivedScheduledRelease, publishedASAPRelease],
      error: undefined,
      loading: false,
    }

    const wrapper = await createTestProvider({
      resources: [releasesUsEnglishLocaleBundle],
    })
    const user = userEvent.setup()

    render(<ReleasePickerMenu onSelect={vi.fn()} />, {wrapper})

    const openButton = await screen.findByRole('button', {name: /open/i})
    await user.click(openButton)

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true')
    })

    expect(screen.getByText(activeASAPRelease.metadata.title)).toBeInTheDocument()
    expect(screen.queryByText(archivedScheduledRelease.metadata.title)).not.toBeInTheDocument()
    expect(screen.queryByText(publishedASAPRelease.metadata.title)).not.toBeInTheDocument()
  })

  it('should hide the release matching excludeReleaseId', async () => {
    mockUseAllReleasesReturn = {
      data: [activeASAPRelease, activeScheduledRelease],
      error: undefined,
      loading: false,
    }

    const wrapper = await createTestProvider({
      resources: [releasesUsEnglishLocaleBundle],
    })
    const user = userEvent.setup()

    render(<ReleasePickerMenu onSelect={vi.fn()} excludeReleaseId="rASAP" />, {wrapper})

    const openButton = await screen.findByRole('button', {name: /open/i})
    await user.click(openButton)

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true')
    })

    expect(screen.getByText(activeScheduledRelease.metadata.title)).toBeInTheDocument()
    expect(screen.queryByText(activeASAPRelease.metadata.title)).not.toBeInTheDocument()
  })

  it('should render empty state when no active releases remain after filtering', async () => {
    mockUseAllReleasesReturn = {
      data: [archivedScheduledRelease],
      error: undefined,
      loading: false,
    }

    const wrapper = await createTestProvider({
      resources: [releasesUsEnglishLocaleBundle],
    })

    render(<ReleasePickerMenu onSelect={vi.fn()} />, {wrapper})

    expect(screen.getByText('No active releases')).toBeInTheDocument()
    expect(screen.queryByRole('option')).not.toBeInTheDocument()
  })

  it('should render error state when useAllReleases returns an error', async () => {
    mockUseAllReleasesReturn = {
      data: [],
      error: new Error('fail'),
      loading: false,
    }

    const wrapper = await createTestProvider({
      resources: [releasesUsEnglishLocaleBundle],
    })

    render(<ReleasePickerMenu onSelect={vi.fn()} />, {wrapper})

    expect(screen.getByText('Could not load releases')).toBeInTheDocument()
  })
})
