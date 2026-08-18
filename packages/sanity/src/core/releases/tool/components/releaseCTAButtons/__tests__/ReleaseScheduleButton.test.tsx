import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {beforeEach, describe, expect, test, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {activeScheduledRelease} from '../../../../__fixtures__/release.fixture'
import {releasesUsEnglishLocaleBundle} from '../../../../i18n'
import {
  mockUseReleaseOperations,
  useReleaseOperationsMockReturn,
} from '../../../../store/__tests__/__mocks/useReleaseOperations.mock'
import {
  mockUseReleasePermissions,
  useReleasePermissionsMockReturn,
  useReleasesPermissionsMockReturnTrue,
} from '../../../../store/__tests__/__mocks/useReleasePermissions.mock'
import {type DocumentInRelease} from '../../../detail/types'
import {ReleaseScheduleButton} from '../ReleaseScheduleButton'

vi.mock('../../../../store/useReleaseOperations', () => ({
  useReleaseOperations: vi.fn(() => useReleaseOperationsMockReturn),
}))

vi.mock('../../../../store/useReleasePermissions', () => ({
  useReleasePermissions: vi.fn(() => useReleasePermissionsMockReturn),
}))

// A scheduled-type release that is currently active (i.e. the state after
// unscheduling). Its intended publish date is far in the future so the schedule
// dialog can be confirmed without hitting the "date in past" guard.
const futureIntendedPublishAt = '2030-10-10T10:00:00.000Z'
const release = {
  ...activeScheduledRelease,
  metadata: {
    ...activeScheduledRelease.metadata,
    intendedPublishAt: futureIntendedPublishAt,
  },
}

const createDocumentInRelease = (documentId: string): DocumentInRelease =>
  ({
    memoKey: documentId,
    document: {
      _id: documentId,
      _type: 'test-document',
      _createdAt: '2023-10-01T08:00:00Z',
      _updatedAt: '2023-10-01T09:00:00Z',
      _rev: 'some-rev',
      publishedDocumentExists: true,
      draftDocumentExists: false,
    },
    validation: {
      isValidating: false,
      hasError: false,
      validation: [],
    },
  }) as unknown as DocumentInRelease

const documents = [createDocumentInRelease('versions.rActive.doc1')]

const openScheduleDialog = async () => {
  const wrapper = await createTestProvider({
    resources: [releasesUsEnglishLocaleBundle],
  })
  render(<ReleaseScheduleButton release={release} documents={documents} />, {wrapper})

  await waitFor(() => {
    expect(screen.getByTestId('schedule-button')).not.toBeDisabled()
  })

  await userEvent.click(screen.getByTestId('schedule-button'))

  screen.getByTestId('confirm-schedule-dialog')
}

describe('ReleaseScheduleButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)
    mockUseReleaseOperations.mockReturnValue(useReleaseOperationsMockReturn)
    useReleaseOperationsMockReturn.schedule.mockResolvedValue({transactionId: 'transaction'})
    useReleaseOperationsMockReturn.updateRelease.mockResolvedValue({transactionId: 'transaction'})
  })

  test('locks in intendedPublishAt to the newly scheduled date when scheduling (SAPP-2726)', async () => {
    await openScheduleDialog()

    // change the scheduled date to a new future date
    const dateInput = screen.getByTestId('date-input')
    await userEvent.clear(dateInput)
    await userEvent.type(dateInput, 'Oct 15, 2030 10:00')
    await userEvent.tab()

    await userEvent.click(screen.getByTestId('confirm-button'))

    await waitFor(() => {
      expect(useReleaseOperationsMockReturn.schedule).toHaveBeenCalled()
    })

    const scheduledDate = useReleaseOperationsMockReturn.schedule.mock.calls[0][1] as Date

    // the intended publish date must be updated to match the date the release is
    // being scheduled for, so a later unschedule reverts to this date and not the
    // previously planned one
    expect(useReleaseOperationsMockReturn.updateRelease).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: release._id,
        metadata: expect.objectContaining({
          releaseType: 'scheduled',
          intendedPublishAt: scheduledDate.toISOString(),
        }),
      }),
    )
    // the selected date is genuinely different from the original intended date
    expect(scheduledDate.toISOString()).not.toBe(futureIntendedPublishAt)
  })

  test('does not update the release when the scheduled date is unchanged', async () => {
    await openScheduleDialog()

    // confirm without changing the pre-filled (intended) date
    await userEvent.click(screen.getByTestId('confirm-button'))

    await waitFor(() => {
      expect(useReleaseOperationsMockReturn.schedule).toHaveBeenCalled()
    })

    expect(useReleaseOperationsMockReturn.updateRelease).not.toHaveBeenCalled()
  })

  test('does not schedule and shows an error toast when updateRelease fails', async () => {
    useReleaseOperationsMockReturn.updateRelease.mockReset()
    useReleaseOperationsMockReturn.updateRelease.mockRejectedValue(new Error('network error'))

    await openScheduleDialog()

    // change the scheduled date to a new future date
    const dateInput = screen.getByTestId('date-input')
    await userEvent.clear(dateInput)
    await userEvent.type(dateInput, 'Oct 15, 2030 10:00')
    await userEvent.tab()

    await userEvent.click(screen.getByTestId('confirm-button'))

    await waitFor(() => {
      expect(useReleaseOperationsMockReturn.updateRelease).toHaveBeenCalled()
    })

    expect(await screen.findByText(/network error/)).toBeInTheDocument()
    expect(useReleaseOperationsMockReturn.schedule).not.toHaveBeenCalled()
  })
})
