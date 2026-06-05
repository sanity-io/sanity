import {type ReleaseDocument} from '@sanity/client'
import {render, screen, waitFor} from '@testing-library/react'
import {useArchivedReleases} from 'sanity'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../../../i18n'
import {ArchivedReleaseDocumentBanner} from '../ArchivedReleaseDocumentBanner'

vi.mock('sanity', async () => {
  const sanity = await vi.importActual('sanity')
  return {
    ...sanity,
    useArchivedReleases: vi.fn(),
  }
})

// NOTE: the banner imports `usePaneRouter` directly from
// `../../../../components/paneRouter/usePaneRouter`, so the mock must target that
// exact module specifier — mocking the `../components` barrel does not intercept it.
vi.mock('../../../../../components/paneRouter/usePaneRouter', () => ({
  usePaneRouter: vi.fn(() => ({
    params: {},
    setParams: vi.fn(),
  })),
}))

const {usePaneRouter} = vi.mocked(
  await import('../../../../../components/paneRouter/usePaneRouter'),
)

const mockUseArchivedReleases = useArchivedReleases as Mock<typeof useArchivedReleases>

const archivedScheduledDraft: ReleaseDocument = {
  _rev: 'rev1',
  _id: '_.releases.rScheduledDraft',
  _type: 'system.release',
  _createdAt: '2023-10-10T08:00:00Z',
  _updatedAt: '2023-10-10T09:00:00Z',
  state: 'archived',
  metadata: {
    title: 'My Scheduled Draft',
    releaseType: 'scheduled',
    intendedPublishAt: '2023-10-10T10:00:00.000Z',
    description: 'A scheduled draft that was archived',
    cardinality: 'one',
  },
}

const archivedRelease: ReleaseDocument = {
  _rev: 'rev2',
  _id: '_.releases.rArchivedRelease',
  _type: 'system.release',
  _createdAt: '2023-10-10T08:00:00Z',
  _updatedAt: '2023-10-10T09:00:00Z',
  state: 'archived',
  metadata: {
    title: 'My Archived Release',
    releaseType: 'asap',
    description: 'A release that was archived',
  },
}

describe('ArchivedReleaseDocumentBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('finds the archived release using historyVersion param when no releaseId prop is provided', async () => {
    mockUseArchivedReleases.mockReturnValue({
      data: [archivedRelease],
      loading: false,
    })

    usePaneRouter.mockReturnValue({
      params: {historyVersion: 'rArchivedRelease'},
      setParams: vi.fn(),
    } as any)

    const wrapper = await createTestProvider({resources: [structureUsEnglishLocaleBundle]})
    render(<ArchivedReleaseDocumentBanner />, {wrapper})

    // Assert on the specific release title so the test proves the release was
    // actually resolved via the historyVersion param — the generic archived-release
    // fallback text also contains "archived" and would pass even without a match.
    await waitFor(() => {
      expect(screen.getByText(/My Archived Release/)).toBeInTheDocument()
    })
  })

  it('finds the archived release using releaseId prop (for archived scheduled drafts)', async () => {
    mockUseArchivedReleases.mockReturnValue({
      data: [archivedScheduledDraft],
      loading: false,
    })

    usePaneRouter.mockReturnValue({
      params: {scheduledDraft: 'rScheduledDraft'},
      setParams: vi.fn(),
    } as any)

    const wrapper = await createTestProvider({resources: [structureUsEnglishLocaleBundle]})
    render(<ArchivedReleaseDocumentBanner releaseId="rScheduledDraft" />, {wrapper})

    await waitFor(() => {
      expect(screen.getByText(/scheduled draft is archived/i)).toBeInTheDocument()
    })
  })

  it('prefers the releaseId prop over historyVersion param', async () => {
    mockUseArchivedReleases.mockReturnValue({
      data: [archivedScheduledDraft, archivedRelease],
      loading: false,
    })

    usePaneRouter.mockReturnValue({
      params: {historyVersion: 'rArchivedRelease'},
      setParams: vi.fn(),
    } as any)

    const wrapper = await createTestProvider({resources: [structureUsEnglishLocaleBundle]})
    render(<ArchivedReleaseDocumentBanner releaseId="rScheduledDraft" />, {wrapper})

    // Should show the scheduled draft banner, not the archived release banner
    await waitFor(() => {
      expect(screen.getByText(/scheduled draft is archived/i)).toBeInTheDocument()
    })
  })
})
