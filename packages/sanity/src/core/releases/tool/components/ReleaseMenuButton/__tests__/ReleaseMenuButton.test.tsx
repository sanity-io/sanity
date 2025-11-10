import {type ReleaseDocument, type ReleaseState} from '@sanity/client'
import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {beforeEach, describe, expect, test, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {
  activeASAPRelease,
  activeScheduledRelease,
  activeUndecidedRelease,
  archivedScheduledRelease,
  publishedASAPRelease,
  scheduledRelease,
} from '../../../../__fixtures__/release.fixture'
import {useReleasesUpsellMockReturn} from '../../../../contexts/upsell/__mocks__/useReleasesUpsell.mock'
import {releasesUsEnglishLocaleBundle} from '../../../../i18n'
import {
  mockUseReleaseOperations,
  useReleaseOperationsMockReturn,
} from '../../../../store/__tests__/__mocks/useReleaseOperations.mock'
import {
  mockUseReleasePermissions,
  useReleasePermissionsMockReturn,
  useReleasesPermissionsMockReturnFalse,
  useReleasesPermissionsMockReturnTrue,
} from '../../../../store/__tests__/__mocks/useReleasePermissions.mock'
import {useReleaseOperations} from '../../../../store/useReleaseOperations'
import {
  mockUseBundleDocuments,
  useBundleDocumentsMockReturn,
  useBundleDocumentsMockReturnWithResults,
} from '../../../detail/__tests__/__mocks__/useBundleDocuments.mock'
import {ReleaseMenuButton, type ReleaseMenuButtonProps} from '../ReleaseMenuButton'

// hoisted so that mockUseIsReleasesPlus can be set to false for tests also
const {mockUseIsReleasesPlus} = vi.hoisted(() => ({
  mockUseIsReleasesPlus: vi.fn(() => true),
}))

vi.mock('../../../../store/useReleaseOperations', () => ({
  useReleaseOperations: vi.fn(() => useReleaseOperationsMockReturn),
}))

vi.mock('../../../../store/useReleasePermissions', () => ({
  useReleasePermissions: vi.fn(() => useReleasePermissionsMockReturn),
}))

vi.mock('../../../detail/useBundleDocuments', () => ({
  useBundleDocuments: vi.fn(() => useBundleDocumentsMockReturnWithResults),
}))

vi.mock('../../../../hooks/useIsReleasesPlus', () => ({
  useIsReleasesPlus: mockUseIsReleasesPlus,
}))

vi.mock('../../../../contexts/upsell/useReleasesUpsell', () => ({
  useReleasesUpsell: vi.fn(() => useReleasesUpsellMockReturn),
}))

vi.mock('sanity/router', async (importOriginal) => ({
  ...(await importOriginal()),
  useRouter: vi.fn().mockReturnValue({state: {}, navigate: vi.fn()}),
}))

const renderTest = async ({
  release,
  documentsCount,
  ignoreCTA = false,
  documents = [],
}: ReleaseMenuButtonProps) => {
  const wrapper = await createTestProvider({
    resources: [releasesUsEnglishLocaleBundle],
  })
  return render(
    <ReleaseMenuButton
      ignoreCTA={ignoreCTA}
      release={release}
      documentsCount={documentsCount}
      documents={documents}
    />,
    {wrapper},
  )
}

describe('ReleaseMenuButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockUseBundleDocuments.mockRestore()

    mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)
    mockUseIsReleasesPlus.mockReturnValue(true)
  })

  describe('when permission is provided', () => {
    beforeEach(() => {
      mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)
      mockUseIsReleasesPlus.mockReturnValue(true)
    })

    describe('archive release', () => {
      const openConfirmArchiveDialog = async () => {
        await renderTest({release: activeScheduledRelease, documentsCount: 1})

        await waitFor(() => {
          screen.getByTestId('release-menu-button')
        })

        await userEvent.click(screen.getByTestId('release-menu-button'))
        screen.getByTestId('archive-release-menu-item')

        await waitFor(() => {
          expect(screen.getByTestId('archive-release-menu-item')).not.toBeDisabled()
        })

        await userEvent.click(screen.getByTestId('archive-release-menu-item'))

        screen.getByTestId('confirm-archive-dialog')
      }

      test('does not allow for archiving of archived releases', async () => {
        await renderTest({release: archivedScheduledRelease, documentsCount: 1})

        await waitFor(() => {
          screen.getByTestId('release-menu-button')
        })

        await userEvent.click(screen.getByTestId('release-menu-button'))

        expect(screen.queryByTestId('archive-release-menu-item')).not.toBeInTheDocument()
      })

      test('does not allow for published of archived releases', async () => {
        await renderTest({release: publishedASAPRelease, documentsCount: 1})

        await waitFor(() => {
          screen.getByTestId('release-menu-button')
        })

        await userEvent.click(screen.getByTestId('release-menu-button'))

        expect(screen.queryByTestId('archive-release-menu-item-menu-item')).not.toBeInTheDocument()
      })

      test('requires confirmation when no documents in release', async () => {
        mockUseBundleDocuments.mockReturnValue(useBundleDocumentsMockReturn)

        await renderTest({release: activeScheduledRelease, documentsCount: 0})

        await waitFor(() => {
          screen.getByTestId('release-menu-button')
        })

        await userEvent.click(screen.getByTestId('release-menu-button'))
        screen.getByTestId('archive-release-menu-item')

        await waitFor(() => {
          expect(screen.getByTestId('archive-release-menu-item')).not.toBeDisabled()
        })

        await userEvent.click(screen.getByTestId('archive-release-menu-item'))

        expect(screen.getByTestId('confirm-archive-dialog')).toBeInTheDocument()
        await userEvent.click(screen.getByTestId('confirm-button'))

        expect(useReleaseOperationsMockReturn.archive).toHaveBeenCalledWith(
          activeScheduledRelease._id,
        )
      })

      test('can reject archiving', async () => {
        await openConfirmArchiveDialog()

        await userEvent.click(screen.getByTestId('cancel-button'))

        expect(screen.queryByTestId('confirm-archive-dialog')).not.toBeInTheDocument()
      })

      describe('when archiving is successful', () => {
        beforeEach(async () => {
          await openConfirmArchiveDialog()
        })

        test('will archive an active release', async () => {
          await userEvent.click(screen.getByTestId('confirm-button'))

          expect(useReleaseOperations().archive).toHaveBeenCalledWith(activeScheduledRelease._id)
          expect(screen.queryByTestId('confirm-archive-dialog')).not.toBeInTheDocument()
        })
      })

      describe('when archiving fails', () => {
        beforeEach(async () => {
          mockUseReleaseOperations.mockReturnValue({
            ...useReleaseOperationsMockReturn,
            archive: vi.fn().mockRejectedValue(new Error('some rejection reason')),
          })

          await openConfirmArchiveDialog()
        })

        test('will not archive the release', async () => {
          await userEvent.click(screen.getByTestId('confirm-button'))

          expect(useReleaseOperations().archive).toHaveBeenCalledWith(activeScheduledRelease._id)
          expect(screen.queryByTestId('confirm-archive-dialog')).not.toBeInTheDocument()
        })
      })
    })

    describe('delete release', () => {
      const openConfirmDeleteDialog = async () => {
        await renderTest({release: archivedScheduledRelease, documentsCount: 1})

        await waitFor(() => {
          screen.getByTestId('release-menu-button')
        })

        await userEvent.click(screen.getByTestId('release-menu-button'))
        screen.getByTestId('delete-release-menu-item')

        await waitFor(() => {
          expect(screen.getByTestId('delete-release-menu-item')).not.toBeDisabled()
        })

        await userEvent.click(screen.getByTestId('delete-release-menu-item'))

        screen.getByTestId('confirm-delete-dialog')
      }

      test('does not allow for deleting an active release', async () => {
        await renderTest({release: activeScheduledRelease, documentsCount: 1})

        await waitFor(() => {
          screen.getByTestId('release-menu-button')
        })

        await userEvent.click(screen.getByTestId('release-menu-button'))

        expect(screen.queryByTestId('delete-release-menu-item')).not.toBeInTheDocument()
      })

      test('requires confirmation when no documents in release', async () => {
        mockUseBundleDocuments.mockReturnValue(useBundleDocumentsMockReturn)

        // verifying that delete supported for published releases too
        await renderTest({release: publishedASAPRelease, documentsCount: 0})

        await waitFor(() => {
          screen.getByTestId('release-menu-button')
        })

        await userEvent.click(screen.getByTestId('release-menu-button'))
        screen.getByTestId('delete-release-menu-item')

        await waitFor(() => {
          expect(screen.getByTestId('delete-release-menu-item')).not.toBeDisabled()
        })

        await userEvent.click(screen.getByTestId('delete-release-menu-item'))

        expect(screen.getByTestId('confirm-delete-dialog')).toBeInTheDocument()
        await userEvent.click(screen.getByTestId('confirm-button'))
        expect(useReleaseOperationsMockReturn.deleteRelease).toHaveBeenCalledWith(
          publishedASAPRelease._id,
        )
      })

      test('can reject deleting', async () => {
        await openConfirmDeleteDialog()

        await userEvent.click(screen.getByTestId('cancel-button'))

        expect(screen.queryByTestId('confirm-delete-dialog')).not.toBeInTheDocument()
      })

      describe('when deleting is successful', () => {
        beforeEach(async () => {
          await openConfirmDeleteDialog()
        })

        test('will delete an active release', async () => {
          await userEvent.click(screen.getByTestId('confirm-button'))

          expect(useReleaseOperations().deleteRelease).toHaveBeenCalledWith(
            archivedScheduledRelease._id,
          )
          expect(screen.queryByTestId('confirm-delete-dialog')).not.toBeInTheDocument()
        })
      })

      describe('when deleting fails', () => {
        beforeEach(async () => {
          mockUseReleaseOperations.mockReturnValue({
            ...useReleaseOperationsMockReturn,
            deleteRelease: vi.fn().mockRejectedValue(new Error('some rejection reason')),
          })

          await openConfirmDeleteDialog()
        })

        test('will not delete the release', async () => {
          await userEvent.click(screen.getByTestId('confirm-button'))

          expect(useReleaseOperations().deleteRelease).toHaveBeenCalledWith(
            archivedScheduledRelease._id,
          )
          await waitFor(() =>
            expect(screen.queryByTestId('confirm-delete-dialog')).not.toBeInTheDocument(),
          )
        })
      })
    })

    describe('unschedule release', () => {
      test.each([
        {state: 'archived', fixture: archivedScheduledRelease},
        {state: 'active', fixture: activeScheduledRelease},
        {state: 'published', fixture: publishedASAPRelease},
      ])('will not allow for unscheduling of $state releases', async ({fixture}) => {
        await renderTest({release: fixture, documentsCount: 1})

        await waitFor(() => {
          screen.getByTestId('release-menu-button')
        })
        await userEvent.click(screen.getByTestId('release-menu-button'))

        expect(screen.queryByTestId('unschedule-release-menu-item')).not.toBeInTheDocument()
      })

      test.each([
        {state: 'scheduled', fixture: scheduledRelease},
        {state: 'scheduling', fixture: {...scheduledRelease, state: 'scheduling' as ReleaseState}},
      ])('will unschedule a $state release', async ({fixture}) => {
        await renderTest({release: fixture, documentsCount: 1})

        await waitFor(() => {
          screen.getByTestId('release-menu-button')
        })

        await userEvent.click(screen.getByTestId('release-menu-button'))

        await userEvent.click(screen.getByTestId('unschedule-release-menu-item'))

        // does not require confirmation
        expect(useReleaseOperations().unschedule).toHaveBeenCalledWith(fixture._id)
      })
    })

    describe('schedule release', () => {
      test.each([
        {state: 'archived', fixture: archivedScheduledRelease},
        {state: 'published', fixture: publishedASAPRelease},
      ])('will not allow for scheduling of $state releases', async ({fixture}) => {
        await renderTest({release: fixture, documentsCount: 1})

        await waitFor(() => {
          screen.getByTestId('release-menu-button')
        })

        await userEvent.click(screen.getByTestId('release-menu-button'))

        expect(screen.queryByTestId('schedule-button-menu-item')).not.toBeInTheDocument()
      })

      test.each([
        {state: 'active', fixture: activeScheduledRelease},
        {state: 'active', fixture: activeASAPRelease},
        {state: 'active', fixture: activeUndecidedRelease},
      ])('will schedule a $state release', async ({fixture}) => {
        await renderTest({
          release: fixture,
          documentsCount: 1,
          documents: [
            {
              memoKey: 'some-m',
              document: {
                _id: `some-id`,
                _type: 'some-type',
                _createdAt: '2023-01-01T00:00:00Z',
                _updatedAt: '2023-01-01T00:00:00Z',
                _rev: 'some-rev',
                title: 'some title',
                publishedDocumentExists: true,
              },
              validation: {
                isValidating: false,
                hasError: false,
                validation: [],
              },
              previewValues: {
                isLoading: false,
                values: undefined,
              },
            },
          ],
        })

        await waitFor(() => {
          screen.getByTestId('release-menu-button')
        })

        await userEvent.click(screen.getByTestId('release-menu-button'))

        await waitFor(() => {
          expect(screen.getByTestId('schedule-button-menu-item')).not.toBeDisabled()
        })

        await userEvent.click(screen.getByTestId('schedule-button-menu-item'))

        await userEvent.click(screen.getByTestId('publish-all-button-menu-item'))

        expect(screen.getByTestId('confirm-publish-dialog')).toBeInTheDocument()
      })
    })

    describe('publish release', () => {
      test.each([
        {state: 'archived', fixture: archivedScheduledRelease},
        {state: 'published', fixture: publishedASAPRelease},
      ])('will not allow for publish of $state releases', async ({fixture}) => {
        await renderTest({release: fixture, documentsCount: 1})

        await waitFor(() => {
          screen.getByTestId('release-menu-button')
        })

        await userEvent.click(screen.getByTestId('release-menu-button'))

        expect(screen.queryByTestId('publish-all-button-menu-item')).not.toBeInTheDocument()
      })

      test.each([
        {state: 'active', fixture: activeScheduledRelease},
        {state: 'active', fixture: activeASAPRelease},
        {state: 'active', fixture: activeUndecidedRelease},
      ])('will publish a $state release', async ({fixture}) => {
        await renderTest({
          release: fixture,
          documentsCount: 1,
          documents: [
            {
              memoKey: 'some-m',
              document: {
                _id: `some-id`,
                _type: 'some-type',
                _createdAt: '2023-01-01T00:00:00Z',
                _updatedAt: '2023-01-01T00:00:00Z',
                _rev: 'some-rev',
                title: 'some title',
                publishedDocumentExists: true,
              },
              validation: {
                isValidating: false,
                hasError: false,
                validation: [],
              },
              previewValues: {
                isLoading: false,
                values: undefined,
              },
            },
          ],
        })

        await waitFor(() => {
          screen.getByTestId('release-menu-button')
        })

        await userEvent.click(screen.getByTestId('release-menu-button'))

        await waitFor(() => {
          expect(screen.getByTestId('publish-all-button-menu-item')).not.toBeDisabled()
        })

        await userEvent.click(screen.getByTestId('publish-all-button-menu-item'))

        expect(screen.getByTestId('confirm-publish-dialog')).toBeInTheDocument()
      })
    })

    test.todo('will unarchive an archived release', async () => {
      /** @todo update once unarchive has been implemented */
      const archivedRelease: ReleaseDocument = {...activeScheduledRelease, state: 'archived'}

      await renderTest({release: archivedRelease, documentsCount: 1})

      await userEvent.click(screen.getByTestId('release-menu-button'))

      await userEvent.click(screen.getByTestId('archive-release-menu-item'))

      expect(useReleaseOperations().updateRelease).toHaveBeenCalledWith({
        ...archivedRelease,
        archivedAt: undefined,
      })
    })

    test('will hide CTAs when ignoreCTA is true', async () => {
      await renderTest({release: scheduledRelease, ignoreCTA: true, documentsCount: 1})

      await waitFor(() => {
        screen.getByTestId('release-menu-button')
      })

      await userEvent.click(screen.getByTestId('release-menu-button'))

      expect(screen.queryByTestId('unschedule-release-menu-item')).not.toBeInTheDocument()
    })

    describe('duplicate release', () => {
      const duplicateReleaseMock = vi.fn()

      beforeEach(() => {
        duplicateReleaseMock.mockReset().mockResolvedValue({releaseId: 'new-duplicated-release-id'})
        mockUseReleaseOperations.mockReturnValue({
          ...useReleaseOperationsMockReturn,
          duplicateRelease: duplicateReleaseMock,
        })
      })

      test.each([
        {name: 'active scheduled', release: activeScheduledRelease},
        {name: 'active ASAP', release: activeASAPRelease},
        {name: 'active undecided', release: activeUndecidedRelease},
      ])('allows duplicating an $name release', async ({release}) => {
        await renderTest({release, documentsCount: 1, documents: []})

        await screen.findByTestId('release-menu-button')
        await userEvent.click(screen.getByTestId('release-menu-button'))

        const duplicateMenuItem = screen.getByTestId('duplicate-release-menu-item')

        await waitFor(() => {
          expect(duplicateMenuItem).not.toBeDisabled()
        })

        await userEvent.click(duplicateMenuItem)

        screen.getByTestId('confirm-duplicate-dialog')

        await userEvent.click(screen.getByTestId('confirm-button'))

        expect(duplicateReleaseMock).toHaveBeenCalled()
      })

      test.each([
        {state: 'archived', fixture: archivedScheduledRelease},
        {state: 'published', fixture: publishedASAPRelease},
      ])('does not allow for duplicating of $state releases', async ({fixture}) => {
        await renderTest({release: fixture, documentsCount: 1})

        await screen.findByTestId('release-menu-button')
        await userEvent.click(screen.getByTestId('release-menu-button'))

        expect(screen.queryByTestId('duplicate-release-menu-item')).not.toBeInTheDocument()
      })

      test('does not show duplicate menu item when useIsReleasesPlus returns false', async () => {
        mockUseIsReleasesPlus.mockReturnValue(false)

        await renderTest({release: activeScheduledRelease, documentsCount: 1, documents: []})

        await screen.findByTestId('release-menu-button')
        await userEvent.click(screen.getByTestId('release-menu-button'))

        expect(screen.queryByTestId('duplicate-release-menu-item')).not.toBeInTheDocument()
      })

      describe('when duplication fails', () => {
        beforeEach(() => {
          duplicateReleaseMock.mockRejectedValue(new Error('some duplication error'))
        })

        test('handles failure when trying to duplicate an active release', async () => {
          await renderTest({release: activeScheduledRelease, documentsCount: 1, documents: []})

          await screen.findByTestId('release-menu-button')
          await userEvent.click(screen.getByTestId('release-menu-button'))

          const duplicateMenuItem = screen.getByTestId('duplicate-release-menu-item')

          await waitFor(() => {
            expect(duplicateMenuItem).not.toBeDisabled()
          })

          await userEvent.click(duplicateMenuItem)

          screen.getByTestId('confirm-duplicate-dialog')

          await userEvent.click(screen.getByTestId('confirm-button'))

          expect(duplicateReleaseMock).toHaveBeenCalled()
        })
      })
    })
  })

  describe('when permission is not provided', () => {
    beforeEach(() => {
      vi.clearAllMocks()

      mockUseBundleDocuments.mockRestore()

      mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnFalse)
      mockUseIsReleasesPlus.mockReturnValue(true)
    })

    test('will disable archive menu', async () => {
      await renderTest({release: activeScheduledRelease, documentsCount: 1})

      await waitFor(() => {
        screen.getByTestId('release-menu-button')
      })

      await userEvent.click(screen.getByTestId('release-menu-button'))

      expect(screen.getByTestId('archive-release-menu-item')).toBeDisabled()
    })

    test('will disable delete menu', async () => {
      await renderTest({release: archivedScheduledRelease, documentsCount: 1})

      await waitFor(() => {
        screen.getByTestId('release-menu-button')
      })

      await userEvent.click(screen.getByTestId('release-menu-button'))

      expect(screen.getByTestId('delete-release-menu-item')).toBeDisabled()
    })

    test('will disable unarchive menu', async () => {
      await renderTest({release: archivedScheduledRelease, documentsCount: 1})

      await waitFor(() => {
        screen.getByTestId('release-menu-button')
      })

      await userEvent.click(screen.getByTestId('release-menu-button'))

      expect(screen.getByTestId('unarchive-release-menu-item')).toBeDisabled()
    })

    test('will disable duplicate menu', async () => {
      await renderTest({release: activeScheduledRelease, documentsCount: 1})

      await screen.findByTestId('release-menu-button')
      await userEvent.click(screen.getByTestId('release-menu-button'))

      expect(screen.getByTestId('duplicate-release-menu-item')).toBeDisabled()
    })
  })
})
