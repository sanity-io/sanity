import {type BaseActionOptions} from '@sanity/client'
import {useCallback} from 'react'

import {getDraftId} from '../../util'
import {useReleaseOperations} from '../store/useReleaseOperations'
import {createReleaseId} from '../util/createReleaseId'
import {getReleaseIdFromReleaseDocumentId} from '../util/getReleaseIdFromReleaseDocumentId'

export interface ScheduleDraftOperationsValue {
  schedulePublish: (
    documentId: string,
    publishAt: Date,
    title?: string,
    opts?: BaseActionOptions,
  ) => Promise<string>
  /**
   * Immediately publishes a scheduled draft by unscheduling and then publishing
   */
  runNow: (releaseDocumentId: string, opts?: BaseActionOptions) => Promise<void>
  /**
   * Deletes a scheduled draft by unscheduling, archiving, and then deleting
   */
  deleteSchedule: (releaseDocumentId: string, opts?: BaseActionOptions) => Promise<void>
  /**
   * Reschedules a draft to a new publish time
   */
  reschedule: (
    releaseDocumentId: string,
    newPublishAt: Date,
    opts?: BaseActionOptions,
  ) => Promise<void>
}

/**
 * Hook for scheduling draft operations.
 *
 * Provides operations for scheduling document publishing and unpublishing,
 * as well as combined operations for managing scheduled drafts.
 *
 * @internal
 */
export function useScheduleDraftOperations(): ScheduleDraftOperationsValue {
  const releaseOperations = useReleaseOperations()

  const createScheduledRelease = useCallback(
    async (title: string, scheduleAt: Date, opts?: BaseActionOptions): Promise<string> => {
      const releaseDocumentId = createReleaseId()

      await releaseOperations.createRelease(
        {
          _id: releaseDocumentId,
          metadata: {
            title,
            description: '',
            releaseType: 'scheduled',
            cardinality: 'one',
            intendedPublishAt: scheduleAt.toISOString(),
          },
        },
        opts,
      )

      return releaseDocumentId
    },
    [releaseOperations],
  )

  const handleSchedulePublish = useCallback(
    async (
      documentId: string,
      publishAt: Date,
      title?: string,
      opts?: BaseActionOptions,
    ): Promise<string> => {
      // Create the release (but don't schedule it yet)
      const releaseTitle = title ? `Scheduled publish of '${title}'` : 'Schedule Publish'
      const releaseDocumentId = await createScheduledRelease(releaseTitle, publishAt, opts)

      // Create a version of the document in the release (using draft as base)
      const draftId = getDraftId(documentId)
      const releaseId = getReleaseIdFromReleaseDocumentId(releaseDocumentId)
      await releaseOperations.createVersion(releaseId, draftId, opts)

      // Now schedule the release after adding the document
      await releaseOperations.schedule(releaseDocumentId, publishAt, opts)

      return releaseDocumentId
    },
    [releaseOperations, createScheduledRelease],
  )

  const handleRunNow = useCallback(
    async (releaseDocumentId: string, opts?: BaseActionOptions): Promise<void> => {
      // First unschedule the release
      await releaseOperations.unschedule(releaseDocumentId, opts)

      // Then immediately publish it
      await releaseOperations.publishRelease(releaseDocumentId, opts)
    },
    [releaseOperations],
  )

  const handleDeleteSchedule = useCallback(
    async (releaseDocumentId: string, opts?: BaseActionOptions): Promise<void> => {
      // First unschedule the release
      await releaseOperations.unschedule(releaseDocumentId, opts)

      // Then archive it
      await releaseOperations.archive(releaseDocumentId, opts)

      // Finally delete it
      await releaseOperations.deleteRelease(releaseDocumentId, opts)
    },
    [releaseOperations],
  )

  const handleReschedule = useCallback(
    async (
      releaseDocumentId: string,
      newPublishAt: Date,
      opts?: BaseActionOptions,
    ): Promise<void> => {
      // First unschedule the release
      await releaseOperations.unschedule(releaseDocumentId, opts)

      // Then schedule it with the new date
      await releaseOperations.schedule(releaseDocumentId, newPublishAt, opts)
    },
    [releaseOperations],
  )

  return {
    schedulePublish: handleSchedulePublish,
    runNow: handleRunNow,
    deleteSchedule: handleDeleteSchedule,
    reschedule: handleReschedule,
  }
}
