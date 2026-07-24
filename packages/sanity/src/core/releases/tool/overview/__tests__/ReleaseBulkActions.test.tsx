import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {beforeEach, describe, expect, test, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {
  mockUseScheduleDraftOperations,
  useScheduleDraftOperationsMockReturn,
} from '../../../../singleDocRelease/hooks/__mocks__/useScheduleDraftOperations.mock'
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
import {type CardinalityView, type Mode} from '../queryParamUtils'
import {ReleaseBulkActions} from '../ReleaseBulkActions'
import {type TableRelease} from '../ReleasesOverview'

vi.mock('../../../store/useReleaseOperations', () => ({
  useReleaseOperations: vi.fn(() => useReleaseOperationsMockReturn),
}))

vi.mock('../../../../singleDocRelease/hooks/useScheduleDraftOperations', () => ({
  useScheduleDraftOperations: vi.fn(() => useScheduleDraftOperationsMockReturn),
}))

const activeRelease: TableRelease = activeASAPRelease
const scheduledTableRelease: TableRelease = scheduledRelease
const archivedRelease: TableRelease = archivedScheduledRelease
const publishedRelease: TableRelease = publishedASAPRelease

// Scheduled-drafts (cardinality 'one') fixtures for the drafts-view action-set cases.
const armedDraft: TableRelease = {
  ...activeASAPRelease,
  _id: '_.releases.rArmedDraft',
  state: 'scheduled',
  metadata: {
    ...activeASAPRelease.metadata,
    title: 'Armed draft',
    cardinality: 'one',
  },
}

const pausedDraft: TableRelease = {
  ...activeASAPRelease,
  _id: '_.releases.rPausedDraft',
  state: 'active',
  metadata: {
    ...activeASAPRelease.metadata,
    title: 'Paused draft',
    cardinality: 'one',
    releaseType: 'scheduled',
    intendedPublishAt: '2024-12-26T10:00:00Z',
  },
}

const archivedDraft: TableRelease = {
  ...archivedScheduledRelease,
  _id: '_.releases.rArchivedDraft',
  state: 'archived',
  metadata: {
    ...archivedScheduledRelease.metadata,
    title: 'Archived draft',
    cardinality: 'one',
  },
}

const publishedDraft: TableRelease = {
  ...publishedASAPRelease,
  _id: '_.releases.rPublishedDraft',
  state: 'published',
  metadata: {
    ...publishedASAPRelease.metadata,
    title: 'Published draft',
    cardinality: 'one',
  },
}

const renderTest = async (
  selectedReleases: TableRelease[],
  mode: Mode = 'active',
  onClear = vi.fn(),
  cardinalityView: CardinalityView = 'releases',
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
        cardinalityView={cardinalityView}
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
    mockUseScheduleDraftOperations.mockReturnValue(useScheduleDraftOperationsMockReturn)
    useScheduleDraftOperationsMockReturn.deleteScheduledDraft.mockResolvedValue(undefined)
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

  describe('scheduled drafts view (cardinalityView === "drafts")', () => {
    describe('active/paused mode', () => {
      test('offers only "Delete schedule" — Archive/Archive-and-delete are not rendered', async () => {
        await renderTest([armedDraft], 'active', vi.fn(), 'drafts')

        expect(
          await screen.findByTestId('release-overview-bulk-delete-schedule'),
        ).toBeInTheDocument()
        expect(screen.queryByTestId('release-overview-bulk-archive')).not.toBeInTheDocument()
        expect(
          screen.queryByTestId('release-overview-bulk-archive-and-delete'),
        ).not.toBeInTheDocument()
      })

      test('"Delete schedule" is enabled for scheduled/active drafts', async () => {
        await renderTest([armedDraft], 'active', vi.fn(), 'drafts')

        expect(
          await screen.findByTestId('release-overview-bulk-delete-schedule'),
        ).not.toBeDisabled()
      })

      test('"Delete schedule" is also offered in Paused mode', async () => {
        await renderTest([pausedDraft], 'paused', vi.fn(), 'drafts')

        expect(
          await screen.findByTestId('release-overview-bulk-delete-schedule'),
        ).toBeInTheDocument()
      })

      test('calls deleteScheduledDraft(id, true) for each selected release by default (keep-content checked), without archive/deleteRelease', async () => {
        const onClear = vi.fn()
        await renderTest([armedDraft, pausedDraft], 'active', onClear, 'drafts')

        await userEvent.click(await screen.findByTestId('release-overview-bulk-delete-schedule'))
        await userEvent.click(screen.getByTestId('confirm-button'))

        await waitFor(() => {
          expect(useScheduleDraftOperationsMockReturn.deleteScheduledDraft).toHaveBeenCalledTimes(2)
        })
        expect(useScheduleDraftOperationsMockReturn.deleteScheduledDraft).toHaveBeenCalledWith(
          armedDraft._id,
          true,
        )
        expect(useScheduleDraftOperationsMockReturn.deleteScheduledDraft).toHaveBeenCalledWith(
          pausedDraft._id,
          true,
        )
        expect(useReleaseOperationsMockReturn.archive).not.toHaveBeenCalled()
        expect(useReleaseOperationsMockReturn.deleteRelease).not.toHaveBeenCalled()
        expect(onClear).toHaveBeenCalled()
      })

      test('counts a release as failed if deleteScheduledDraft rejects', async () => {
        useScheduleDraftOperationsMockReturn.deleteScheduledDraft.mockRejectedValueOnce(
          new Error('boom'),
        )

        await renderTest([armedDraft], 'active', vi.fn(), 'drafts')

        await userEvent.click(await screen.findByTestId('release-overview-bulk-delete-schedule'))
        await userEvent.click(screen.getByTestId('confirm-button'))

        await waitFor(() => {
          expect(screen.getByText('Some schedules could not be deleted')).toBeInTheDocument()
        })
      })

      describe('keep-content checkbox', () => {
        test('is present in the delete-schedule confirm dialog, checked by default', async () => {
          await renderTest([armedDraft], 'active', vi.fn(), 'drafts')

          await userEvent.click(await screen.findByTestId('release-overview-bulk-delete-schedule'))

          const checkbox = await screen.findByTestId('release-overview-bulk-keep-content-checkbox')
          expect(checkbox).toBeInTheDocument()
          expect(checkbox).toBeChecked()
          expect(screen.getByText('Keep edited content as drafts')).toBeInTheDocument()
        })

        test('is absent from the archive/unarchive/delete/archive-and-delete confirm dialogs', async () => {
          await renderTest([activeRelease], 'active', vi.fn(), 'releases')
          await userEvent.click(await screen.findByTestId('release-overview-bulk-archive'))
          expect(
            screen.queryByTestId('release-overview-bulk-keep-content-checkbox'),
          ).not.toBeInTheDocument()
          await userEvent.click(screen.getByTestId('cancel-button'))

          await userEvent.click(
            await screen.findByTestId('release-overview-bulk-archive-and-delete'),
          )
          expect(
            screen.queryByTestId('release-overview-bulk-keep-content-checkbox'),
          ).not.toBeInTheDocument()
        })

        test('unchecking runs deleteScheduledDraft(id, false)', async () => {
          await renderTest([armedDraft], 'active', vi.fn(), 'drafts')

          await userEvent.click(await screen.findByTestId('release-overview-bulk-delete-schedule'))

          const checkbox = await screen.findByTestId('release-overview-bulk-keep-content-checkbox')
          await userEvent.click(checkbox)
          expect(checkbox).not.toBeChecked()

          await userEvent.click(screen.getByTestId('confirm-button'))

          await waitFor(() => {
            expect(useScheduleDraftOperationsMockReturn.deleteScheduledDraft).toHaveBeenCalledWith(
              armedDraft._id,
              false,
            )
          })
        })

        test('resets to checked when the dialog is reopened', async () => {
          await renderTest([armedDraft], 'active', vi.fn(), 'drafts')

          await userEvent.click(await screen.findByTestId('release-overview-bulk-delete-schedule'))
          const firstCheckbox = await screen.findByTestId(
            'release-overview-bulk-keep-content-checkbox',
          )
          await userEvent.click(firstCheckbox)
          expect(firstCheckbox).not.toBeChecked()

          await userEvent.click(screen.getByTestId('cancel-button'))

          await userEvent.click(await screen.findByTestId('release-overview-bulk-delete-schedule'))
          const reopenedCheckbox = await screen.findByTestId(
            'release-overview-bulk-keep-content-checkbox',
          )
          expect(reopenedCheckbox).toBeChecked()
        })
      })
    })

    describe('archived mode', () => {
      test('offers Unarchive + Delete, same as the All/Releases archived mode', async () => {
        await renderTest([archivedDraft], 'archived', vi.fn(), 'drafts')

        expect(await screen.findByTestId('release-overview-bulk-unarchive')).toBeInTheDocument()
        expect(screen.getByTestId('release-overview-bulk-delete')).toBeInTheDocument()
        expect(
          screen.queryByTestId('release-overview-bulk-delete-schedule'),
        ).not.toBeInTheDocument()
      })

      test('unarchive is enabled only for archived drafts, not published ones', async () => {
        await renderTest([archivedDraft, publishedDraft], 'archived', vi.fn(), 'drafts')

        expect(await screen.findByTestId('release-overview-bulk-unarchive')).not.toBeDisabled()

        await userEvent.click(screen.getByTestId('release-overview-bulk-unarchive'))
        await userEvent.click(screen.getByTestId('confirm-button'))

        await waitFor(() => {
          expect(useReleaseOperationsMockReturn.unarchive).toHaveBeenCalledTimes(1)
        })
        expect(useReleaseOperationsMockReturn.unarchive).toHaveBeenCalledWith(archivedDraft._id)
      })

      test('delete applies to both archived and published drafts directly', async () => {
        await renderTest([archivedDraft, publishedDraft], 'archived', vi.fn(), 'drafts')

        await userEvent.click(await screen.findByTestId('release-overview-bulk-delete'))
        await userEvent.click(screen.getByTestId('confirm-button'))

        await waitFor(() => {
          expect(useReleaseOperationsMockReturn.deleteRelease).toHaveBeenCalledTimes(2)
        })
        expect(useReleaseOperationsMockReturn.deleteRelease).toHaveBeenCalledWith(archivedDraft._id)
        expect(useReleaseOperationsMockReturn.deleteRelease).toHaveBeenCalledWith(
          publishedDraft._id,
        )
      })
    })
  })

  describe('All / Releases views are unaffected by cardinalityView="all"', () => {
    test('active mode still offers archive/archive-and-delete when cardinalityView is "all"', async () => {
      await renderTest([activeRelease], 'active', vi.fn(), 'all')

      expect(await screen.findByTestId('release-overview-bulk-archive')).toBeInTheDocument()
      expect(screen.getByTestId('release-overview-bulk-archive-and-delete')).toBeInTheDocument()
    })

    test('archived mode still offers unarchive/delete when cardinalityView is "all"', async () => {
      await renderTest([archivedRelease], 'archived', vi.fn(), 'all')

      expect(await screen.findByTestId('release-overview-bulk-unarchive')).toBeInTheDocument()
      expect(screen.getByTestId('release-overview-bulk-delete')).toBeInTheDocument()
    })
  })
})
