import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import {act} from 'react'
import {beforeEach, describe, expect, test, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {releasesUsEnglishLocaleBundle} from '../../../../i18n'
import {type ReleaseDocument} from '../../../../index'
import {useReleaseOperationsMock} from '../../../../store/__tests__/__mocks/useReleaseOperations.mock'
import {useReleaseOperations} from '../../../../store/useReleaseOperations'
import {ReleaseMenuButton, type ReleaseMenuButtonProps} from '../ReleaseMenuButton'

vi.mock('../../../../store/useReleaseOperations', () => ({
  useReleaseOperations: vi.fn(() => useReleaseOperationsMock),
}))

vi.mock('../../../detail/useBundleDocuments', () => ({
  useBundleDocuments: vi.fn().mockReturnValue({
    loading: false,
    results: [{_id: 'versions.releaseId.documentId', _type: 'document'}],
  }),
}))

vi.mock('sanity/router', async (importOriginal) => ({
  ...(await importOriginal()),
  useRouter: vi.fn().mockReturnValue({state: {}, navigate: vi.fn()}),
}))

const renderTest = async ({release, disabled = false}: ReleaseMenuButtonProps) => {
  const wrapper = await createTestProvider({
    resources: [releasesUsEnglishLocaleBundle],
  })
  return render(<ReleaseMenuButton disabled={disabled} release={release} />, {wrapper})
}

describe('ReleaseMenuButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('archive release', () => {
    const openConfirmArchiveDialog = async () => {
      const activeRelease: ReleaseDocument = {
        _id: '_.releases.activeRelease',
        _type: 'system.release',
        createdBy: '',
        _createdAt: '',
        _updatedAt: '',
        state: 'active',
        name: 'active release',
        metadata: {
          title: 'active Release',
          releaseType: 'scheduled',
          intendedPublishAt: '2023-10-01T10:00:00Z',
        },
      }

      await renderTest({release: activeRelease})

      await waitFor(() => {
        screen.getByTestId('release-menu-button')
      })

      fireEvent.click(screen.getByTestId('release-menu-button'))
      screen.getByTestId('archive-release')

      await act(() => {
        fireEvent.click(screen.getByTestId('archive-release'))
      })

      screen.getByTestId('confirm-archive-dialog')
    }

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

        expect(useReleaseOperations().archive).toHaveBeenCalledWith('_.releases.activeRelease')
        expect(screen.queryByTestId('confirm-archive-dialog')).not.toBeInTheDocument()
      })
    })

    describe('when archiving fails', () => {
      beforeEach(async () => {
        useReleaseOperationsMock.archive.mockRejectedValue(new Error('some rejection reason'))

        await openConfirmArchiveDialog()
      })

      test('will not archive the release', async () => {
        await act(() => {
          fireEvent.click(screen.getByTestId('confirm-button'))
        })

        expect(useReleaseOperations().archive).toHaveBeenCalledWith('_.releases.activeRelease')
        expect(screen.queryByTestId('confirm-archive-dialog')).not.toBeInTheDocument()
      })
    })
  })

  test.todo('will unarchive an archived release', async () => {
    const archivedRelease: ReleaseDocument = {
      _id: '_.releases.archivedRelease',
      _type: 'system.release',
      createdBy: '',
      _createdAt: '',
      _updatedAt: '',
      state: 'archived',
      name: 'archived release',
      metadata: {
        title: 'Archived Release',
        releaseType: 'scheduled',
        intendedPublishAt: '2023-10-01T10:00:00Z',
      },
    }

    await renderTest({release: archivedRelease})

    fireEvent.click(screen.getByTestId('release-menu-button'))

    await act(() => {
      fireEvent.click(screen.getByTestId('archive-release'))
    })

    expect(useReleaseOperations().updateRelease).toHaveBeenCalledWith({
      ...archivedRelease,
      archivedAt: undefined,
    })
  })

  test('will be disabled', async () => {
    const disabledActionRelease: ReleaseDocument = {
      _id: '_.releases.activeEmptyRelease',
      _type: 'system.release',
      createdBy: '',
      _createdAt: '',
      _updatedAt: '',
      state: 'active',
      name: 'active empty release',
      metadata: {
        title: 'active empty release',
        releaseType: 'scheduled',
        intendedPublishAt: '2023-10-01T10:00:00Z',
      },
    }

    await renderTest({release: disabledActionRelease, disabled: true})

    const actionsButton = screen.getByTestId('release-menu-button')

    expect(actionsButton).toBeDisabled()

    fireEvent.click(actionsButton)

    expect(screen.queryByTestId('archive-release')).not.toBeInTheDocument()
  })
})
