import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {beforeEach, describe, expect, test, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {
  activeASAPRelease,
  archivedScheduledRelease,
  publishedASAPRelease,
  scheduledRelease,
} from '../../../__fixtures__/release.fixture'
import {releasesUsEnglishLocaleBundle} from '../../../i18n'
import {
  mockUseReleaseOperations,
  useReleaseOperationsMockReturn,
} from '../../../store/__tests__/__mocks/useReleaseOperations.mock'
import {type Mode} from '../queryParamUtils'
import {ReleaseBulkActions} from '../ReleaseBulkActions'
import {type TableRelease} from '../ReleasesOverview'

vi.mock('../../../store/useReleaseOperations', () => ({
  useReleaseOperations: vi.fn(() => useReleaseOperationsMockReturn),
}))

const activeRelease: TableRelease = activeASAPRelease
const scheduledTableRelease: TableRelease = scheduledRelease
const archivedRelease: TableRelease = archivedScheduledRelease
const publishedRelease: TableRelease = publishedASAPRelease

const renderTest = async (
  selectedReleases: TableRelease[],
  mode: Mode = 'active',
  onClear = vi.fn(),
) => {
  const wrapper = await createTestProvider({
    resources: [releasesUsEnglishLocaleBundle],
  })
  return {
    onClear,
    ...render(
      <ReleaseBulkActions
        selectedReleases={selectedReleases}
        mode={mode}
        compact={false}
        onClear={onClear}
      />,
      {wrapper},
    ),
  }
}

describe('ReleaseBulkActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseReleaseOperations.mockReturnValue(useReleaseOperationsMockReturn)
    useReleaseOperationsMockReturn.archive.mockResolvedValue({transactionId: 'transaction'})
    useReleaseOperationsMockReturn.unarchive.mockResolvedValue({transactionId: 'transaction'})
    useReleaseOperationsMockReturn.deleteRelease.mockResolvedValue(undefined)
  })

  describe('archive eligibility', () => {
    test('is enabled when only active releases are selected', async () => {
      await renderTest([activeRelease])

      expect(await screen.findByTestId('release-overview-bulk-archive')).not.toBeDisabled()
    })

    test('is disabled when only scheduled releases are selected', async () => {
      await renderTest([scheduledTableRelease])

      expect(await screen.findByTestId('release-overview-bulk-archive')).toBeDisabled()
    })

    test('archiving a mixed selection only runs on the archivable releases and notes the skipped one', async () => {
      await renderTest([activeRelease, scheduledTableRelease])

      const archiveButton = await screen.findByTestId('release-overview-bulk-archive')
      expect(archiveButton).not.toBeDisabled()

      await userEvent.click(archiveButton)

      expect(
        await screen.findByText('1 scheduled release will be skipped — unschedule it first.'),
      ).toBeInTheDocument()

      await userEvent.click(screen.getByTestId('confirm-button'))

      await waitFor(() => {
        expect(useReleaseOperationsMockReturn.archive).toHaveBeenCalledTimes(1)
      })
      expect(useReleaseOperationsMockReturn.archive).toHaveBeenCalledWith(activeRelease._id)
      expect(useReleaseOperationsMockReturn.archive).not.toHaveBeenCalledWith(
        scheduledTableRelease._id,
      )
    })
  })

  describe('archive-and-delete eligibility', () => {
    test('is enabled when only active releases are selected', async () => {
      await renderTest([activeRelease])

      expect(
        await screen.findByTestId('release-overview-bulk-archive-and-delete'),
      ).not.toBeDisabled()
    })

    test('is disabled when only scheduled releases are selected', async () => {
      await renderTest([scheduledTableRelease])

      expect(await screen.findByTestId('release-overview-bulk-archive-and-delete')).toBeDisabled()
    })

    test('archives then deletes only the eligible releases in a mixed selection, and notes the skipped one', async () => {
      const onClear = vi.fn()
      await renderTest([activeRelease, scheduledTableRelease], 'active', onClear)

      const archiveAndDeleteButton = await screen.findByTestId(
        'release-overview-bulk-archive-and-delete',
      )
      expect(archiveAndDeleteButton).not.toBeDisabled()

      await userEvent.click(archiveAndDeleteButton)

      expect(
        await screen.findByText('1 scheduled release will be skipped — unschedule it first.'),
      ).toBeInTheDocument()

      await userEvent.click(screen.getByTestId('confirm-button'))

      await waitFor(() => {
        expect(useReleaseOperationsMockReturn.deleteRelease).toHaveBeenCalledTimes(1)
      })
      expect(useReleaseOperationsMockReturn.archive).toHaveBeenCalledWith(activeRelease._id)
      expect(useReleaseOperationsMockReturn.deleteRelease).toHaveBeenCalledWith(activeRelease._id)
      expect(useReleaseOperationsMockReturn.archive).not.toHaveBeenCalledWith(
        scheduledTableRelease._id,
      )
      expect(useReleaseOperationsMockReturn.deleteRelease).not.toHaveBeenCalledWith(
        scheduledTableRelease._id,
      )

      // archive must resolve before delete is invoked for the same release
      const archiveOrder = useReleaseOperationsMockReturn.archive.mock.invocationCallOrder[0]
      const deleteOrder = useReleaseOperationsMockReturn.deleteRelease.mock.invocationCallOrder[0]
      expect(archiveOrder).toBeLessThan(deleteOrder)

      expect(onClear).toHaveBeenCalled()
    })

    test('counts a release as failed if delete rejects even though archive succeeded', async () => {
      useReleaseOperationsMockReturn.deleteRelease.mockRejectedValueOnce(new Error('boom'))

      await renderTest([activeRelease])

      await userEvent.click(await screen.findByTestId('release-overview-bulk-archive-and-delete'))
      await userEvent.click(screen.getByTestId('confirm-button'))

      await waitFor(() => {
        expect(
          screen.getByText('Some releases could not be archived and deleted'),
        ).toBeInTheDocument()
      })
      expect(screen.queryByText('Archived and deleted 1 release')).not.toBeInTheDocument()
    })
  })

  describe('archived mode', () => {
    describe('unarchive eligibility', () => {
      test('is enabled when only archived releases are selected', async () => {
        await renderTest([archivedRelease], 'archived')

        expect(await screen.findByTestId('release-overview-bulk-unarchive')).not.toBeDisabled()
      })

      test('is disabled when only published releases are selected', async () => {
        await renderTest([publishedRelease], 'archived')

        expect(await screen.findByTestId('release-overview-bulk-unarchive')).toBeDisabled()
      })

      test('unarchiving a mixed selection only runs on archived releases and notes the skipped one', async () => {
        await renderTest([archivedRelease, publishedRelease], 'archived')

        const unarchiveButton = await screen.findByTestId('release-overview-bulk-unarchive')
        expect(unarchiveButton).not.toBeDisabled()

        await userEvent.click(unarchiveButton)

        expect(
          await screen.findByText('1 published release will be skipped — it cannot be unarchived.'),
        ).toBeInTheDocument()

        await userEvent.click(screen.getByTestId('confirm-button'))

        await waitFor(() => {
          expect(useReleaseOperationsMockReturn.unarchive).toHaveBeenCalledTimes(1)
        })
        expect(useReleaseOperationsMockReturn.unarchive).toHaveBeenCalledWith(archivedRelease._id)
        expect(useReleaseOperationsMockReturn.unarchive).not.toHaveBeenCalledWith(
          publishedRelease._id,
        )
      })
    })

    describe('delete eligibility', () => {
      test('is enabled when an archived release is selected', async () => {
        await renderTest([archivedRelease], 'archived')

        expect(await screen.findByTestId('release-overview-bulk-delete')).not.toBeDisabled()
      })

      test('is enabled when a published release is selected', async () => {
        await renderTest([publishedRelease], 'archived')

        expect(await screen.findByTestId('release-overview-bulk-delete')).not.toBeDisabled()
      })

      test('deletes both archived and published releases directly, without archiving first', async () => {
        const onClear = vi.fn()
        await renderTest([archivedRelease, publishedRelease], 'archived', onClear)

        await userEvent.click(await screen.findByTestId('release-overview-bulk-delete'))
        await userEvent.click(screen.getByTestId('confirm-button'))

        await waitFor(() => {
          expect(useReleaseOperationsMockReturn.deleteRelease).toHaveBeenCalledTimes(2)
        })
        expect(useReleaseOperationsMockReturn.deleteRelease).toHaveBeenCalledWith(
          archivedRelease._id,
        )
        expect(useReleaseOperationsMockReturn.deleteRelease).toHaveBeenCalledWith(
          publishedRelease._id,
        )
        expect(useReleaseOperationsMockReturn.archive).not.toHaveBeenCalled()
        expect(onClear).toHaveBeenCalled()
      })
    })
  })
})
