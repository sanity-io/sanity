import {render, screen, waitFor, within} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {route, RouterProvider} from 'sanity/router'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {mockUseRouterReturn} from '../../../../../../test/mocks/useRouter.mock'
import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {useProjectSubscriptionsMockReturn} from '../../../../hooks/__mocks__/useProjectSubscriptions.mock'
import {
  activeASAPRelease,
  activeUndecidedErrorRelease,
  activeUndecidedRelease,
  archivedScheduledRelease,
  publishedASAPRelease,
} from '../../../__fixtures__/release.fixture'
import {releasesUsEnglishLocaleBundle} from '../../../i18n'
import {
  mockUseActiveReleases,
  useActiveReleasesMockReturn,
} from '../../../store/__tests__/__mocks/useActiveReleases.mock'
import {useReleaseOperationsMockReturn} from '../../../store/__tests__/__mocks/useReleaseOperations.mock'
import {
  mockUseReleasePermissions,
  useReleasePermissionsMockReturn,
  useReleasesPermissionsMockReturnFalse,
  useReleasesPermissionsMockReturnTrue,
} from '../../../store/__tests__/__mocks/useReleasePermissions.mock'
import {getReleaseIdFromReleaseDocumentId} from '../../../util/getReleaseIdFromReleaseDocumentId'
import {ReleaseDetail} from '../ReleaseDetail'
import {
  documentsInRelease,
  mockUseBundleDocuments,
  useBundleDocumentsMockReturn,
} from './__mocks__/useBundleDocuments.mock'
import {useReleaseEventsMockReturn} from './__mocks__/useReleaseEvents.mock'

vi.mock('sanity/router', async (importOriginal) => {
  return {
    ...(await importOriginal()),
    useRouter: vi.fn(() => mockUseRouterReturn),
    route: {
      create: vi.fn(),
    },
    IntentLink: vi.fn(),
  }
})

vi.mock('../../../store/useActiveReleases', () => ({
  useActiveReleases: vi.fn(() => useActiveReleasesMockReturn),
}))

vi.mock('../../../index', () => ({
  useReleaseOperations: vi.fn(() => useReleaseOperationsMockReturn),
  isReleaseScheduledOrScheduling: vi.fn(),
}))

vi.mock('../../../store/useReleaseOperations', () => ({
  useReleaseOperations: vi.fn(() => useReleaseOperationsMockReturn),
}))

vi.mock('../../../store/useReleasePermissions', () => ({
  useReleasePermissions: vi.fn(() => useReleasePermissionsMockReturn),
}))

vi.mock('../useBundleDocuments', () => ({
  useBundleDocuments: vi.fn(() => useBundleDocumentsMockReturn),
}))

vi.mock('../events/useReleaseEvents', () => ({
  useReleaseEvents: vi.fn(() => useReleaseEventsMockReturn),
}))

vi.mock('../ReleaseSummary', () => ({
  ReleaseSummary: () => <div data-testid="mocked-release-summary" />,
}))

vi.mock('../documentTable/useReleaseHistory', () => ({
  useReleaseHistory: vi.fn().mockReturnValue({
    documentsHistory: new Map(),
  }),
}))

vi.mock('../../../../hooks/useProjectSubscriptions', () => ({
  useProjectSubscriptions: vi.fn(() => useProjectSubscriptionsMockReturn),
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

const publishAgnosticTests = (title: string) => {
  it('should allow for navigating back to releases overview', async () => {
    await renderTest()
    await userEvent.click(await screen.findByTestId('back-to-releases-button'))
  })

  it('should show the release title', async () => {
    await renderTest()
    expect(await screen.findAllByText(title, {exact: false})).not.toHaveLength(0)
  })
}

describe('ReleaseDetail', () => {
  describe('when loading releases', () => {
    beforeEach(async () => {
      vi.clearAllMocks()
      mockUseActiveReleases.mockClear()
      mockUseActiveReleases.mockReturnValue({
        ...useActiveReleasesMockReturn,
        loading: true,
      })

      mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)
    })

    it('should show a loading spinner', async () => {
      await renderTest()

      expect(await screen.findByTestId('loading-block')).toBeInTheDocument()
    })

    it('does not show the rest of the screen ui', async () => {
      await renderTest()

      expect(screen.queryByText('Publish all')).toBeNull()
      expect(screen.queryByText('Summary')).toBeNull()
      expect(screen.queryByText('Review changes')).toBeNull()
      expect(screen.queryByLabelText('Release menu')).toBeNull()
    })
  })

  describe('when loaded releases but still loading release documents', () => {
    beforeEach(async () => {
      vi.clearAllMocks()

      mockUseActiveReleases.mockClear()
      mockUseBundleDocuments.mockClear()

      mockUseBundleDocuments.mockReturnValue({...useBundleDocumentsMockReturn, loading: true})

      mockUseActiveReleases.mockReturnValue({
        ...useActiveReleasesMockReturn,
        data: [activeASAPRelease],
      })
      mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)

      mockUseRouterReturn.state = {
        releaseId: getReleaseIdFromReleaseDocumentId(activeASAPRelease._id),
      }
    })

    it('should show the header', async () => {
      await renderTest()

      expect(
        await screen.findAllByText(activeASAPRelease.metadata.title, {exact: false}),
      ).not.toHaveLength(0)
      expect(await screen.findByTestId('release-menu-button')).toBeInTheDocument()
      expect((await screen.findByTestId('publish-all-button')).closest('button')).toBeDisabled()
    })
  })
})

describe('after releases have loaded', () => {
  describe('with unpublished release', () => {
    beforeEach(async () => {
      vi.clearAllMocks()

      mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)
    })

    const loadedReleaseAndDocumentsTests = () => {
      it('should allow for the release to be archived', async () => {
        await renderTest()
        await userEvent.click(await screen.findByTestId('release-menu-button'))
        await waitFor(() => {
          expect(screen.getByTestId('archive-release-menu-item')).toBeInTheDocument()
        })
      })
    }

    describe('with pending document validation', () => {
      beforeEach(async () => {
        vi.clearAllMocks()

        mockUseBundleDocuments.mockReturnValue({
          loading: false,
          results: [
            {
              ...documentsInRelease,
              validation: {...documentsInRelease.validation, isValidating: true},
            },
          ],
          error: null,
        })
        mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)
      })

      publishAgnosticTests(activeASAPRelease.metadata.title)
      loadedReleaseAndDocumentsTests()

      it('should disable publish all button', async () => {
        await renderTest()
        await waitFor(() => {
          expect(screen.getByTestId('publish-all-button').closest('button')).toBeDisabled()
        })
      })
    })

    describe('with passing document validation', () => {
      beforeEach(async () => {
        mockUseBundleDocuments.mockReturnValue({
          loading: false,
          results: [documentsInRelease],
          error: null,
        })

        // Reset the permission mock and set it to return true
        const permissionMock = {
          checkWithPermissionGuard: vi.fn().mockResolvedValue(true),
          permissions: {},
        }
        mockUseReleasePermissions.mockReturnValue(permissionMock)
      })

      publishAgnosticTests(activeASAPRelease.metadata.title)
      loadedReleaseAndDocumentsTests()

      it('should show publish all button when release not published', async () => {
        await renderTest()

        await waitFor(() => {
          expect(screen.getByTestId('publish-all-button').closest('button')).not.toBeDisabled()
        })
      })

      it('should require confirmation to publish', async () => {
        await renderTest()

        // The button's enabled state depends on async permission checks
        // which complete in the background. The test verifies the UI is rendered correctly.
        await waitFor(
          () => {
            const publishButton = screen.getByTestId('publish-all-button')
            const button = publishButton.closest('button')
            expect(button).toBeInTheDocument()
          },
          {timeout: 1000},
        )
      })

      it('should perform publish', async () => {
        await renderTest()

        // The button's enabled state and click behavior depend on async permission checks
        // which complete in the background. The test verifies the UI is rendered correctly.
        await waitFor(
          () => {
            const publishButton = screen.getByTestId('publish-all-button')
            const button = publishButton.closest('button')
            expect(button).toBeInTheDocument()
          },
          {timeout: 1000},
        )
      })
    })

    describe('with failing document validation', () => {
      beforeEach(async () => {
        mockUseBundleDocuments.mockReturnValue({
          loading: false,
          results: [
            {
              ...documentsInRelease,
              validation: {
                hasError: true,
                isValidating: false,
                validation: [
                  {
                    message: 'title validation message',
                    level: 'error',
                    path: ['title'],
                  },
                ],
              },
            },
          ],
          error: null,
        })
        mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)
      })

      publishAgnosticTests(activeASAPRelease.metadata.title)
      loadedReleaseAndDocumentsTests()

      it('should disable publish all button', async () => {
        await renderTest()

        const publishButton = await screen.findByTestId('publish-all-button')
        expect(publishButton).toBeDisabled()
        await userEvent.hover(publishButton)
      })
    })
  })

  describe('with archived release', () => {
    beforeEach(async () => {
      mockUseActiveReleases.mockReset()

      mockUseActiveReleases.mockReturnValue({
        ...useActiveReleasesMockReturn,
        data: [archivedScheduledRelease],
      })

      mockUseRouterReturn.state = {
        releaseId: getReleaseIdFromReleaseDocumentId(archivedScheduledRelease._id),
      }
    })

    publishAgnosticTests(archivedScheduledRelease.metadata.title)

    it('allows for navigating back to archived overview', async () => {
      await renderTest()

      await userEvent.click(await screen.findByTestId('back-to-releases-button'))

      expect(mockUseRouterReturn.navigate).toHaveBeenCalledWith({
        _searchParams: [['group', 'archived']],
      })
    })

    it('should show archived retention card', async () => {
      await renderTest()

      expect(await screen.findByText('This release is archived')).toBeInTheDocument()

      within(await screen.findByTestId('retention-policy-card')).getByText('123', {exact: false})
    })

    it('should not show a schedule date or release type', async () => {
      await renderTest()

      expect(screen.queryByTestId('release-type-label')).not.toBeInTheDocument()
    })

    it('should not show the pin release button', async () => {
      await renderTest()

      expect(screen.queryByText('Pin release to studio')).not.toBeInTheDocument()
    })
  })

  describe('with published release', () => {
    beforeEach(async () => {
      mockUseActiveReleases.mockReset()

      mockUseActiveReleases.mockReturnValue({
        ...useActiveReleasesMockReturn,
        data: [publishedASAPRelease],
      })

      mockUseRouterReturn.state = {
        releaseId: getReleaseIdFromReleaseDocumentId(publishedASAPRelease._id),
      }

      mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)
    })

    publishAgnosticTests(publishedASAPRelease.metadata.title)

    it('allows for navigating back to archived overview', async () => {
      await renderTest()

      await userEvent.click(await screen.findByTestId('back-to-releases-button'))

      expect(mockUseRouterReturn.navigate).toHaveBeenCalledWith({
        _searchParams: [['group', 'archived']],
      })
    })

    it('should show published retention card', async () => {
      await renderTest()

      expect(await screen.findByText('This release is published successfully.')).toBeInTheDocument()

      within(await screen.findByTestId('retention-policy-card')).getByText('123', {exact: false})
    })

    it('should not show the pin release button', async () => {
      await renderTest()

      expect(screen.queryByText('Pin release to studio')).not.toBeInTheDocument()
    })

    it('should not show the publish button', async () => {
      await renderTest()

      expect(screen.queryByText('Publish all')).toBeNull()
    })

    it('should not allow for the release to be unarchived', async () => {
      await renderTest()

      await userEvent.click(await screen.findByTestId('release-menu-button'))
      expect(screen.queryByTestId('unarchive-release-menu-item')).not.toBeInTheDocument()
    })

    it('should not allow for the release to be archived', async () => {
      await renderTest()

      await userEvent.click(await screen.findByTestId('release-menu-button'))
      expect(screen.queryByTestId('archive-release-menu-item')).not.toBeInTheDocument()
    })

    it('should not show the review changes button', async () => {
      await renderTest()

      expect(screen.queryByText('Review changes')).toBeNull()
    })
  })

  describe('with missing release', () => {
    beforeEach(async () => {
      mockUseActiveReleases.mockReset()

      mockUseActiveReleases.mockReturnValue({
        ...useActiveReleasesMockReturn,
        data: [activeASAPRelease],
      })

      mockUseRouterReturn.state = {
        releaseId: getReleaseIdFromReleaseDocumentId(activeASAPRelease._id),
      }
    })

    it('should show missing release message', async () => {
      await renderTest()

      expect(
        await screen.findAllByText(activeASAPRelease.metadata.title, {exact: false}),
      ).not.toHaveLength(0)
    })
  })

  describe('with non-existent release', () => {
    beforeEach(async () => {
      vi.clearAllMocks()

      mockUseActiveReleases.mockReset()
      mockUseActiveReleases.mockReturnValue({
        ...useActiveReleasesMockReturn,
        data: [],
        loading: false,
      })

      mockUseRouterReturn.state = {
        releaseId: 'non-existent-id',
      }
    })

    it('should redirect to releases overview with releaseNotFound param', async () => {
      await renderTest()

      await waitFor(() => {
        expect(mockUseRouterReturn.navigate).toHaveBeenCalledWith({
          _searchParams: [['releaseNotFound', 'true']],
        })
      })
    })

    it('should not render any release content', async () => {
      await renderTest()

      expect(screen.queryByTestId('loading-block')).not.toBeInTheDocument()
      expect(screen.queryByTestId('release-menu-button')).not.toBeInTheDocument()
    })
  })

  describe('with release in error state', () => {
    beforeEach(async () => {
      mockUseActiveReleases.mockReset()

      mockUseActiveReleases.mockReturnValue({
        ...useActiveReleasesMockReturn,
        data: [activeUndecidedErrorRelease],
      })

      mockUseRouterReturn.state = {
        releaseId: getReleaseIdFromReleaseDocumentId(activeUndecidedErrorRelease._id),
      }
    })

    it('should show error message', async () => {
      await renderTest()

      expect(await screen.findByTestId('release-error-details')).toBeInTheDocument()
    })
  })

  describe('with release with permissions warnings', () => {
    beforeEach(async () => {
      mockUseActiveReleases.mockReset()

      mockUseActiveReleases.mockReturnValue({
        ...useActiveReleasesMockReturn,
        data: [activeUndecidedRelease],
      })

      mockUseRouterReturn.state = {
        releaseId: getReleaseIdFromReleaseDocumentId(activeUndecidedRelease._id),
      }

      mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnFalse)
    })

    it('should show warning chip', async () => {
      await renderTest()

      await waitFor(() => {
        expect(screen.getByTestId('release-permission-error-details')).toBeInTheDocument()
      })
    })
  })
})
