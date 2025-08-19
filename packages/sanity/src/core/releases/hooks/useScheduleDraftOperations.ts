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
}

/**
 * Hook for scheduling draft operations.
 *
 * Provides operations for scheduling document publishing and unpublishing.
 * Follows the same pattern as useVersionOperations.
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

  return {
    schedulePublish: handleSchedulePublish,
  }
}
