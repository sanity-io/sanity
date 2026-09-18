import {type ReleaseDocument} from '@sanity/client'
import {render} from '@testing-library/react'
import {isValidElement, type ReactNode} from 'react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {
  activeCardinalityOneRelease,
  archivedScheduledRelease,
  publishedASAPRelease,
} from '../releases/__fixtures__/release.fixture'
import {
  mockUseArchivedReleases,
  useArchivedReleasesMockReturn,
} from '../releases/store/__tests__/__mocks/useArchivedReleases.mock'
import {usePerspectiveMockReturn} from './__mocks__/usePerspective.mock'
import {ResetArchivedReleasePerspective} from './ResetArchivedReleasePerspective'

const {toastPush, mockedSetPerspective} = vi.hoisted(() => ({
  toastPush: vi.fn(),
  mockedSetPerspective: vi.fn(),
}))

vi.mock('../releases/store/useArchivedReleases', () => ({
  useArchivedReleases: vi.fn(() => useArchivedReleasesMockReturn),
}))

vi.mock('./usePerspective', () => ({
  usePerspective: vi.fn(() => usePerspectiveMockReturn),
}))

vi.mock('./useSetPerspective', () => ({
  useSetPerspective: vi.fn(() => mockedSetPerspective),
}))

vi.mock('@sanity/ui/toast', async (importOriginal) => ({
  ...(await importOriginal()),
  useToast: vi.fn(() => ({push: toastPush})),
}))

vi.mock('../i18n/hooks/useTranslation', () => ({
  useTranslation: () => ({t: (key: string) => key}),
}))

const publishedCardinalityOneRelease: ReleaseDocument = {
  ...activeCardinalityOneRelease,
  state: 'published',
  publishedAt: '2023-10-10T10:00:00Z',
}

function getChildI18nKey(node: ReactNode): string | undefined {
  if (!isValidElement(node)) return undefined
  // oxlint-disable-next-line testing-library/no-node-access -- toast payload is not mounted; inspect Translate props
  const child = (node.props as {children?: ReactNode}).children
  if (!isValidElement(child)) return undefined
  return (child.props as {i18nKey?: string}).i18nKey
}

describe('ResetArchivedReleasePerspective', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    usePerspectiveMockReturn.selectedPerspectiveName = undefined
    mockUseArchivedReleases.mockReturnValue({
      ...useArchivedReleasesMockReturn,
      data: [],
      loading: false,
      error: undefined,
    })
  })

  it('does not clear while archived releases are loading', () => {
    mockUseArchivedReleases.mockReturnValue({
      ...useArchivedReleasesMockReturn,
      data: [publishedASAPRelease],
      loading: true,
    })
    usePerspectiveMockReturn.selectedPerspectiveName = 'rPublished'

    render(<ResetArchivedReleasePerspective />)

    expect(mockedSetPerspective).not.toHaveBeenCalled()
    expect(toastPush).not.toHaveBeenCalled()
  })

  it('clears after archived releases finish loading', () => {
    mockUseArchivedReleases.mockReturnValue({
      ...useArchivedReleasesMockReturn,
      data: [publishedASAPRelease],
      loading: true,
    })
    usePerspectiveMockReturn.selectedPerspectiveName = 'rPublished'

    const {rerender} = render(<ResetArchivedReleasePerspective />)
    expect(mockedSetPerspective).not.toHaveBeenCalled()

    mockUseArchivedReleases.mockReturnValue({
      ...useArchivedReleasesMockReturn,
      data: [publishedASAPRelease],
      loading: false,
    })
    rerender(<ResetArchivedReleasePerspective />)

    expect(mockedSetPerspective).toHaveBeenCalledWith(undefined)
    expect(toastPush).toHaveBeenCalledTimes(1)
  })

  it.each([
    {name: 'published', selectedPerspectiveName: 'published' as const},
    {name: 'undefined', selectedPerspectiveName: undefined},
    {name: 'drafts', selectedPerspectiveName: 'drafts'},
  ])('does not clear the $name system perspective', ({selectedPerspectiveName}) => {
    mockUseArchivedReleases.mockReturnValue({
      ...useArchivedReleasesMockReturn,
      data: [publishedASAPRelease, archivedScheduledRelease],
      loading: false,
    })
    usePerspectiveMockReturn.selectedPerspectiveName = selectedPerspectiveName

    render(<ResetArchivedReleasePerspective />)

    expect(mockedSetPerspective).not.toHaveBeenCalled()
    expect(toastPush).not.toHaveBeenCalled()
  })

  it.each([
    {name: 'an agent bundle', selectedPerspectiveName: 'agent-foo'},
    {name: 'an unknown id', selectedPerspectiveName: 'rstudio-Ni4xNC4w'},
  ])('does not clear $name that is not in the archived list', ({selectedPerspectiveName}) => {
    mockUseArchivedReleases.mockReturnValue({
      ...useArchivedReleasesMockReturn,
      data: [publishedASAPRelease, archivedScheduledRelease],
      loading: false,
    })
    usePerspectiveMockReturn.selectedPerspectiveName = selectedPerspectiveName

    render(<ResetArchivedReleasePerspective />)

    expect(mockedSetPerspective).not.toHaveBeenCalled()
    expect(toastPush).not.toHaveBeenCalled()
  })

  it('clears a published release perspective and shows the published toast', () => {
    mockUseArchivedReleases.mockReturnValue({
      ...useArchivedReleasesMockReturn,
      data: [publishedASAPRelease],
      loading: false,
    })
    usePerspectiveMockReturn.selectedPerspectiveName = 'rPublished'

    render(<ResetArchivedReleasePerspective />)

    expect(mockedSetPerspective).toHaveBeenCalledTimes(1)
    expect(mockedSetPerspective).toHaveBeenCalledWith(undefined)
    expect(toastPush).toHaveBeenCalledTimes(1)

    const payload = toastPush.mock.calls[0]?.[0] as {
      id: string
      status: string
      title: ReactNode
      description: ReactNode
    }
    expect(payload.id).toBe('bundle-deleted-toast-rPublished')
    expect(payload.status).toBe('warning')
    expect(getChildI18nKey(payload.title)).toBe('release.toast.published-release.title')
    expect(getChildI18nKey(payload.description)).toBe('release.toast.published-release.description')
  })

  it('clears an archived release perspective and shows the archived toast', () => {
    mockUseArchivedReleases.mockReturnValue({
      ...useArchivedReleasesMockReturn,
      data: [archivedScheduledRelease],
      loading: false,
    })
    usePerspectiveMockReturn.selectedPerspectiveName = 'rArchived'

    render(<ResetArchivedReleasePerspective />)

    expect(mockedSetPerspective).toHaveBeenCalledWith(undefined)
    expect(toastPush).toHaveBeenCalledTimes(1)

    const payload = toastPush.mock.calls[0]?.[0] as {
      title: ReactNode
      description: ReactNode
    }
    expect(getChildI18nKey(payload.title)).toBe('release.toast.archived-release.title')
    expect(getChildI18nKey(payload.description)).toBe('release.toast.archived-release.description')
  })

  it('shows the scheduled-draft toast for a cardinality-one published release', () => {
    mockUseArchivedReleases.mockReturnValue({
      ...useArchivedReleasesMockReturn,
      data: [publishedCardinalityOneRelease],
      loading: false,
    })
    usePerspectiveMockReturn.selectedPerspectiveName = 'rCardinalityOne'

    render(<ResetArchivedReleasePerspective />)

    expect(mockedSetPerspective).toHaveBeenCalledWith(undefined)
    expect(toastPush).toHaveBeenCalledTimes(1)

    const payload = toastPush.mock.calls[0]?.[0] as {
      title: ReactNode
      description: ReactNode
    }
    expect(getChildI18nKey(payload.title)).toBe('release.toast.scheduled-draft-published.title')
    expect(payload.description).toBeFalsy()
  })
})
