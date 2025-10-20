import {type BaseActionOptions, type ReleaseDocument} from '@sanity/client'
import {useCallback} from 'react'

import {getDraftId} from '../../util'
import {useAllReleases} from '../store/useAllReleases'
import {useReleaseOperations} from '../store/useReleaseOperations'
import {createReleaseId} from '../util/createReleaseId'
import {getReleaseIdFromReleaseDocumentId} from '../util/getReleaseIdFromReleaseDocumentId'
import {isReleaseScheduledOrScheduling} from '../util/util'

export interface ScheduleDraftOperationsValue {
  /**
   * Create a scheduled draft release
   */
  createScheduledDraft: (
    documentId: string,
    publishAt: Date,
    opts?: BaseActionOptions,
  ) => Promise<string>
  /**
   * Immediately publishes a scheduled draft
   */
  publishScheduledDraft: (release: ReleaseDocument, opts?: BaseActionOptions) => Promise<void>
  /**
   * Deletes a scheduled draft
   */
  deleteScheduledDraft: (releaseDocumentId: string, opts?: BaseActionOptions) => Promise<void>
  /**
   * Reschedules a draft to a new publish time
   */
  rescheduleScheduledDraft: (
    releaseDocumentId: string,
    newPublishAt: Date,
    opts?: BaseActionOptions,
  ) => Promise<void>
}

/**
 * @internal
 */
export function useScheduleDraftOperations(): ScheduleDraftOperationsValue {
  const releaseOperations = useReleaseOperations()
  const {data: allReleases} = useAllReleases()

  const createScheduledDraftRelease = useCallback(
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

  const handleCreateScheduledDraft = useCallback(
    async (documentId: string, publishAt: Date, opts?: BaseActionOptions): Promise<string> => {
      // Create the release (but don't schedule it yet)
      const releaseTitle = 'Scheduled publish'
      const releaseDocumentId = await createScheduledDraftRelease(releaseTitle, publishAt, opts)

      // Create a version of the document in the release (using draft as base)
      const draftId = getDraftId(documentId)
      const releaseId = getReleaseIdFromReleaseDocumentId(releaseDocumentId)
      await releaseOperations.createVersion(releaseId, draftId, opts)

      // Now schedule the release after adding the document
      await releaseOperations.schedule(releaseDocumentId, publishAt, opts)

      return releaseDocumentId
    },
    [releaseOperations, createScheduledDraftRelease],
  )

  // used to immediately publish a scheduled draft
  const handlePublishScheduledDraft = useCallback(
    async (release: ReleaseDocument, opts?: BaseActionOptions): Promise<void> => {
      // Only unschedule if the release is currently in a scheduled state
      if (isReleaseScheduledOrScheduling(release)) {
        await releaseOperations.unschedule(release._id, opts)
      }

      // Then immediately publish it
      await releaseOperations.publishRelease(release._id, opts)
    },
    [releaseOperations],
  )

  // This handles scheduled draft releases in a few different states.
  // The end state is we want it deleted so go through the state machine to get there
  const handleDeleteScheduledDraft = useCallback(
    async (releaseDocumentId: string, opts?: BaseActionOptions): Promise<void> => {
      // Look up the release to get its current state
      const release = allReleases.find((r) => r._id === releaseDocumentId)

      if (!release) {
        throw new Error(`Release with ID ${releaseDocumentId} not found`)
      }

      if (release.state === 'scheduled' || release.state === 'scheduling') {
        await releaseOperations.unschedule(releaseDocumentId, opts)
      }

      if (release.state !== 'archived' && release.state !== 'published') {
        await releaseOperations.archive(releaseDocumentId, opts)
      }

      await releaseOperations.deleteRelease(releaseDocumentId, opts)
    },
    [releaseOperations, allReleases],
  )

  const handleRescheduleScheduledDraft = useCallback(
    async (
      releaseDocumentId: string,
      newPublishAt: Date,
      opts?: BaseActionOptions,
    ): Promise<void> => {
      // need to unschedule to bring release to `active` state
      // so that it can be rescheduled with the new date
      await releaseOperations.unschedule(releaseDocumentId, opts)

      await releaseOperations.schedule(releaseDocumentId, newPublishAt, opts)
    },
    [releaseOperations],
  )

  return {
    createScheduledDraft: handleCreateScheduledDraft,
    publishScheduledDraft: handlePublishScheduledDraft,
    deleteScheduledDraft: handleDeleteScheduledDraft,
    rescheduleScheduledDraft: handleRescheduleScheduledDraft,
  }
}
