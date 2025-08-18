import {type BaseActionOptions} from '@sanity/client'
import {useCallback} from 'react'

import {getDraftId} from '../../util'
import {useReleaseOperations} from '../store/useReleaseOperations'
import {createReleaseId} from '../util/createReleaseId'

export interface ScheduleDraftOperationsValue {
  schedulePublish: (
    documentId: string,
    publishAt: Date,
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

  // Shared helper for creating and scheduling a release
  const createScheduledRelease = useCallback(
    async (title: string, scheduleAt: Date, opts?: BaseActionOptions): Promise<string> => {
      const releaseDocumentId = createReleaseId()

      // Step 1: Create a new release with scheduled type and cardinality 'one'
      await releaseOperations.createRelease(
        {
          _id: releaseDocumentId,
          metadata: {
            title,
            description: '',
            releaseType: 'scheduled',
            cardinality: 'one',
          },
        } as EditableStudioReleaseDocument,
        opts,
      )

      // Step 2: Schedule the release for the specified datetime
      await releaseOperations.schedule(releaseDocumentId, scheduleAt, opts)

      return releaseDocumentId
    },
    [releaseOperations],
  )

  const handleSchedulePublish = useCallback(
    async (documentId: string, publishAt: Date, opts?: BaseActionOptions): Promise<string> => {
      // Create and schedule the release
      const releaseDocumentId = await createScheduledRelease('Schedule publish', publishAt, opts)

      // Create a version of the document in the release (using draft as base)
      const draftId = getDraftId(documentId)
      await releaseOperations.createVersion(releaseDocumentId, draftId, opts)

      return releaseDocumentId
    },
    [releaseOperations, createScheduledRelease],
  )

  return {
    schedulePublish: handleSchedulePublish,
  }
}
