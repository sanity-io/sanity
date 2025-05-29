import {render, screen} from '@testing-library/react'
import {route, RouterProvider} from 'sanity/router'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {activeASAPRelease} from '../../../__fixtures__/release.fixture'
import {releasesUsEnglishLocaleBundle} from '../../../i18n'
import {ReleaseDetail} from '../ReleaseDetail'

vi.mock('sanity/router', async (importOriginal) => {
  return {
    ...(await importOriginal()),
    useRouter: vi.fn(() => ({
      state: {
        _searchParams: [],
      },
      navigate: vi.fn(),
      resolvePathFromState: vi.fn(),
      resolveIntentLink: vi.fn(),
      navigateUrl: vi.fn(),
      navigateStickyParams: vi.fn(),
      navigateIntent: vi.fn(),
      stickyParams: {},
    })),
    route: {
      create: vi.fn(),
    },
    IntentLink: vi.fn(),
  }
})

vi.mock('../../../store/useActiveReleases', () => ({
  useActiveReleases: vi.fn(() => ({
    data: [],
    error: undefined,
    loading: false,
    dispatch: vi.fn(),
  })),
}))

vi.mock('../../../index', () => ({
  useReleaseOperations: vi.fn(() => ({
    archive: vi.fn(),
    unarchive: vi.fn(),
    createRelease: vi.fn(),
    createVersion: vi.fn(),
    discardVersion: vi.fn(),
    publishRelease: vi.fn(),
    schedule: vi.fn(),
    unschedule: vi.fn(),
    updateRelease: vi.fn(),
    deleteRelease: vi.fn(),
    revertRelease: vi.fn(),
    unpublishVersion: vi.fn(),
  })),
  isReleaseScheduledOrScheduling: vi.fn(),
}))

vi.mock('../../../store/useReleaseOperations', () => ({
  useReleaseOperations: vi.fn(() => ({
    archive: vi.fn(),
    unarchive: vi.fn(),
    createRelease: vi.fn(),
    createVersion: vi.fn(),
    discardVersion: vi.fn(),
    publishRelease: vi.fn(),
    schedule: vi.fn(),
    unschedule: vi.fn(),
    updateRelease: vi.fn(),
    deleteRelease: vi.fn(),
    revertRelease: vi.fn(),
    unpublishVersion: vi.fn(),
  })),
}))

vi.mock('../../../store/useReleasePermissions', () => ({
  useReleasePermissions: vi.fn(() => ({
    checkWithPermissionGuard: vi.fn(),
    permissions: {},
  })),
}))

vi.mock('../useBundleDocuments', () => ({
  useBundleDocuments: vi.fn(() => ({
    loading: false,
    results: [],
    error: null,
  })),
}))

vi.mock('../events/useReleaseEvents', () => ({
  useReleaseEvents: vi.fn(() => ({
    loading: false,
    events: [],
    hasMore: false,
    error: null,
    loadMore: vi.fn(),
  })),
}))

vi.mock('../../../../hooks/useProjectSubscriptions', () => ({
  useProjectSubscriptions: vi.fn(() => ({
    error: null,
    isLoading: false,
    projectSubscriptions: null,
  })),
}))

vi.mock('../ReleaseSummary', () => ({
  ReleaseSummary: () => <div data-testid="mocked-release-summary" />,
}))

vi.mock('../documentTable/useReleaseHistory', () => ({
  useReleaseHistory: vi.fn().mockReturnValue({
    documentsHistory: new Map(),
  }),
}))

const mockRouterNavigate = vi.fn()

const renderTest = async () => {
  const wrapper = await createTestProvider({
    resources: [releasesUsEnglishLocaleBundle],
  })
  return render(
    <RouterProvider
      state={{
        releaseId: activeASAPRelease._id,
      }}
      onNavigate={mockRouterNavigate}
      router={route.create('/', [route.create('/:releaseId')])}
    >
      <ReleaseDetail />
    </RouterProvider>,
    {wrapper},
  )
}

describe('ReleaseDetail', () => {
  describe('when loading releases', () => {
    beforeEach(async () => {
      vi.clearAllMocks()

      await renderTest()
    })

    it('should show a loading spinner', () => {
      screen.getByTestId('loading-block')
    })

    it('does not show the rest of the screen ui', () => {
      expect(screen.queryByText('Publish all')).toBeNull()
      expect(screen.queryByText('Summary')).toBeNull()
      expect(screen.queryByText('Review changes')).toBeNull()
      expect(screen.queryByLabelText('Release menu')).toBeNull()
    })
  })
})
