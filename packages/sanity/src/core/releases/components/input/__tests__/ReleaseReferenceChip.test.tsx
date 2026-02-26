import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {activeASAPRelease, archivedScheduledRelease} from '../../../__fixtures__/release.fixture'
import {releasesUsEnglishLocaleBundle} from '../../../i18n'
import {ReleaseReferenceChip} from '../ReleaseReferenceChip'

vi.mock('@portabletext/editor', async (importOriginal) => ({
  ...(await importOriginal()),
  usePortableTextEditor: vi.fn(),
}))

const mockUseAllReleases = vi.fn()
vi.mock('../../../store/useAllReleases', () => ({
  useAllReleases: () => mockUseAllReleases(),
}))

const mockResolvePathFromState = vi.fn(() => '/releases/test-url')
vi.mock('sanity/router', async (importOriginal) => ({
  ...(await importOriginal()),
  useRouter: () => ({
    state: {},
    navigate: vi.fn(),
    resolvePathFromState: mockResolvePathFromState,
    resolveIntentLink: vi.fn(),
    navigateUrl: vi.fn(),
    navigateStickyParams: vi.fn(),
    navigateIntent: vi.fn(),
    stickyParams: {},
  }),
}))

const testPath = [{_key: 'test-block'}, 'children', {_key: 'test-child'}]

async function renderChip(releaseId: string) {
  const wrapper = await createTestProvider({
    resources: [releasesUsEnglishLocaleBundle],
  })

  return render(<ReleaseReferenceChip releaseId={releaseId} selected={false} path={testPath} />, {
    wrapper,
  })
}

describe('ReleaseReferenceChip', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders loading state with default-tone dot icon', async () => {
    mockUseAllReleases.mockReturnValue({loading: true, data: []})

    await renderChip('some-release')

    expect(await screen.findByText('Loading...')).toBeInTheDocument()
    expect(screen.getByTestId('release-avatar-default')).toBeInTheDocument()
  })

  it('renders raw releaseId with no dot icon when release is not found', async () => {
    mockUseAllReleases.mockReturnValue({loading: false, data: []})

    await renderChip('nonexistent-release')

    expect(screen.getByText('nonexistent-release')).toBeInTheDocument()
    expect(screen.queryByTestId(/release-avatar/)).toBeNull()
  })

  it('renders resolved active release with title, avatar icon, and click handler', async () => {
    mockUseAllReleases.mockReturnValue({
      loading: false,
      data: [activeASAPRelease],
    })

    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

    await renderChip('rASAP')

    expect(screen.getByText('active asap Release')).toBeInTheDocument()
    expect(screen.getByTestId('release-avatar-caution')).toBeInTheDocument()

    const chip = screen.getByText('active asap Release').closest('span')!
    await userEvent.click(chip)

    expect(windowOpenSpy).toHaveBeenCalledWith(
      '/releases/test-url',
      '_blank',
      'noopener,noreferrer',
    )
  })

  it('renders archived release title inside a strikethrough element', async () => {
    mockUseAllReleases.mockReturnValue({
      loading: false,
      data: [archivedScheduledRelease],
    })

    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

    await renderChip('rArchived')

    const titleElement = screen.getByText('archived Release')
    expect(titleElement.tagName).toBe('S')

    const chip = titleElement.closest('span')!
    await userEvent.click(chip)

    expect(windowOpenSpy).toHaveBeenCalledWith(
      '/releases/test-url',
      '_blank',
      'noopener,noreferrer',
    )
  })
})
