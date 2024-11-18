import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import {act} from 'react'
import {beforeEach, describe, expect, test, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {activeScheduledRelease} from '../../../../__fixtures__/release.fixture'
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
      await renderTest({release: activeScheduledRelease})

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

        expect(useReleaseOperations().archive).toHaveBeenCalledWith(activeScheduledRelease._id)
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

        expect(useReleaseOperations().archive).toHaveBeenCalledWith(activeScheduledRelease._id)
        expect(screen.queryByTestId('confirm-archive-dialog')).not.toBeInTheDocument()
      })
    })
  })

  test.todo('will unarchive an archived release', async () => {
    const archivedRelease: ReleaseDocument = {...activeScheduledRelease, state: 'archived'}

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
    await renderTest({release: activeScheduledRelease, disabled: true})

    const actionsButton = screen.getByTestId('release-menu-button')

    expect(actionsButton).toBeDisabled()

    fireEvent.click(actionsButton)

    expect(screen.queryByTestId('archive-release')).not.toBeInTheDocument()
  })
})
