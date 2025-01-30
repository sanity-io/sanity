import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import {act} from 'react'
import {beforeEach, describe, expect, test, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {
  activeScheduledRelease,
  archivedScheduledRelease,
  publishedASAPRelease,
  scheduledRelease,
} from '../../../../__fixtures__/release.fixture'
import {releasesUsEnglishLocaleBundle} from '../../../../i18n'
import {type ReleaseDocument, type ReleaseState} from '../../../../index'
import {
  mockUseReleaseOperations,
  useReleaseOperationsMockReturn,
} from '../../../../store/__tests__/__mocks/useReleaseOperations.mock'
import {useReleaseOperations} from '../../../../store/useReleaseOperations'
import {
  mockUseBundleDocuments,
  useBundleDocumentsMockReturn,
  useBundleDocumentsMockReturnWithResults,
} from '../../../detail/__tests__/__mocks__/useBundleDocuments.mock'
import {ReleaseMenuButton, type ReleaseMenuButtonProps} from '../ReleaseMenuButton'

vi.mock('../../../../store/useReleaseOperations', () => ({
  useReleaseOperations: vi.fn(() => useReleaseOperationsMockReturn),
}))

vi.mock('../../../detail/useBundleDocuments', () => ({
  useBundleDocuments: vi.fn(() => useBundleDocumentsMockReturnWithResults),
}))

vi.mock('sanity/router', async (importOriginal) => ({
  ...(await importOriginal()),
  useRouter: vi.fn().mockReturnValue({state: {}, navigate: vi.fn()}),
}))

const renderTest = async ({release, documentsCount, ignoreCTA = false}: ReleaseMenuButtonProps) => {
  const wrapper = await createTestProvider({
    resources: [releasesUsEnglishLocaleBundle],
  })
  return render(
    <ReleaseMenuButton ignoreCTA={ignoreCTA} release={release} documentsCount={documentsCount} />,
    {wrapper},
  )
}

describe('ReleaseMenuButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockUseBundleDocuments.mockRestore()
  })

  describe('archive release', () => {
    const openConfirmArchiveDialog = async () => {
      await renderTest({release: activeScheduledRelease, documentsCount: 1})

      await waitFor(() => {
        screen.getByTestId('release-menu-button')
      })

      fireEvent.click(screen.getByTestId('release-menu-button'))
      screen.getByTestId('archive-release-menu-item')

      await act(() => {
        fireEvent.click(screen.getByTestId('archive-release-menu-item'))
      })

      screen.getByTestId('confirm-archive-dialog')
    }

    test('does not allow for archiving of archived releases', async () => {
      await renderTest({release: archivedScheduledRelease, documentsCount: 1})

      await waitFor(() => {
        screen.getByTestId('release-menu-button')
      })

      fireEvent.click(screen.getByTestId('release-menu-button'))

      expect(screen.queryByTestId('archive-release-menu-item')).not.toBeInTheDocument()
    })

    test('does not allow for published of archived releases', async () => {
      await renderTest({release: publishedASAPRelease, documentsCount: 1})

      await waitFor(() => {
        screen.getByTestId('release-menu-button')
      })

      fireEvent.click(screen.getByTestId('release-menu-button'))

      expect(screen.queryByTestId('archive-release-menu-item-menu-item')).not.toBeInTheDocument()
    })

    test('requires confirmation when no documents in release', async () => {
      mockUseBundleDocuments.mockReturnValue(useBundleDocumentsMockReturn)

      await renderTest({release: activeScheduledRelease, documentsCount: 0})

      await waitFor(() => {
        screen.getByTestId('release-menu-button')
      })

      fireEvent.click(screen.getByTestId('release-menu-button'))
      screen.getByTestId('archive-release-menu-item')

      await act(() => {
        fireEvent.click(screen.getByTestId('archive-release-menu-item'))
      })

      expect(screen.queryByTestId('confirm-archive-dialog')).toBeInTheDocument()
      await act(() => {
        fireEvent.click(screen.getByTestId('confirm-button'))
      })
      expect(useReleaseOperationsMockReturn.archive).toHaveBeenCalledWith(
        activeScheduledRelease._id,
      )
    })

    test('can reject archiving', async () => {
      await openConfirmArchiveDialog()

      await act(() => {
        fireEvent.click(screen.getByTestId('cancel-button'))
      })

      expect(screen.queryByTestId('confirm-archive-dialog')).not.toBeInTheDocument()
    })

    describe('when archiving is successful', () => {
      beforeEach(async () => {
        await openConfirmArchiveDialog()
      })

      test('will archive an active release', async () => {
        await act(() => {
          fireEvent.click(screen.getByTestId('confirm-button'))
        })

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
        await act(() => {
          fireEvent.click(screen.getByTestId('confirm-button'))
        })

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

      fireEvent.click(screen.getByTestId('release-menu-button'))
      screen.getByTestId('delete-release-menu-item')

      await act(() => {
        fireEvent.click(screen.getByTestId('delete-release-menu-item'))
      })

      screen.getByTestId('confirm-delete-dialog')
    }

    test('does not allow for deleting an active release', async () => {
      await renderTest({release: activeScheduledRelease, documentsCount: 1})

      await waitFor(() => {
        screen.getByTestId('release-menu-button')
      })

      fireEvent.click(screen.getByTestId('release-menu-button'))

      expect(screen.queryByTestId('delete-release-menu-item')).not.toBeInTheDocument()
    })

    test('requires confirmation when no documents in release', async () => {
      mockUseBundleDocuments.mockReturnValue(useBundleDocumentsMockReturn)

      // verifying that delete supported for published releases too
      await renderTest({release: publishedASAPRelease, documentsCount: 0})

      await waitFor(() => {
        screen.getByTestId('release-menu-button')
      })

      fireEvent.click(screen.getByTestId('release-menu-button'))
      screen.getByTestId('delete-release-menu-item')

      await act(() => {
        fireEvent.click(screen.getByTestId('delete-release-menu-item'))
      })

      expect(screen.queryByTestId('confirm-delete-dialog')).toBeInTheDocument()
      await act(() => {
        fireEvent.click(screen.getByTestId('confirm-button'))
      })
      expect(useReleaseOperationsMockReturn.deleteRelease).toHaveBeenCalledWith(
        publishedASAPRelease._id,
      )
    })

    test('can reject deleting', async () => {
      await openConfirmDeleteDialog()

      await act(() => {
        fireEvent.click(screen.getByTestId('cancel-button'))
      })

      expect(screen.queryByTestId('confirm-delete-dialog')).not.toBeInTheDocument()
    })

    describe('when deleting is successful', () => {
      beforeEach(async () => {
        await openConfirmDeleteDialog()
      })

      test('will delete an active release', async () => {
        await act(() => {
          fireEvent.click(screen.getByTestId('confirm-button'))
        })

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
        await act(() => {
          fireEvent.click(screen.getByTestId('confirm-button'))
        })

        expect(useReleaseOperations().deleteRelease).toHaveBeenCalledWith(
          archivedScheduledRelease._id,
        )
        expect(screen.queryByTestId('confirm-delete-dialog')).not.toBeInTheDocument()
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
      fireEvent.click(screen.getByTestId('release-menu-button'))

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

      fireEvent.click(screen.getByTestId('release-menu-button'))

      fireEvent.click(screen.getByTestId('unschedule-release-menu-item'))

      // does not require confirmation
      expect(useReleaseOperations().unschedule).toHaveBeenCalledWith(fixture._id)
    })
  })

  test.todo('will unarchive an archived release', async () => {
    /** @todo update once unarchive has been implemented */
    const archivedRelease: ReleaseDocument = {...activeScheduledRelease, state: 'archived'}

    await renderTest({release: archivedRelease, documentsCount: 1})

    fireEvent.click(screen.getByTestId('release-menu-button'))

    await act(() => {
      fireEvent.click(screen.getByTestId('archive-release-menu-item'))
    })

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

    fireEvent.click(screen.getByTestId('release-menu-button'))

    expect(screen.queryByTestId('unschedule-release-menu-item')).not.toBeInTheDocument()
  })
})
