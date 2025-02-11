import {type SanityClient} from '@sanity/client'

import {getReleaseIdFromReleaseDocumentId} from '../util/getReleaseIdFromReleaseDocumentId'
import {createRequestAction} from './createReleaseOperationStore'

export interface useReleasePermissionsValue {
  canSchedule: (releaseId: string, publishAt: Date) => Promise<boolean>
  canPublish: (releaseId: string, useUnstableAction?: boolean) => Promise<boolean>
}

export function createReleasePermissionsStore(options: {
  client: SanityClient
  onReleaseLimitReached: (limit: number) => void
}): useReleasePermissionsValue {
  const {client} = options
  const requestAction = createRequestAction(options.onReleaseLimitReached)

  const canSchedule = async (releaseId: string, publishAt: Date) => {
    try {
      await requestAction(
        client,
        [
          {
            actionType: 'sanity.action.release.schedule',
            releaseId: getReleaseIdFromReleaseDocumentId(releaseId),
            publishAt: publishAt.toISOString(),
          },
        ],
        {
          dryRun: true,
          skipCrossDatasetReferenceValidation: true,
        },
      )

      return true
    } catch (e) {
      return false
    }
  }

  const canPublish = async (releaseId: string, useUnstableAction?: boolean) => {
    try {
      await requestAction(
        client,
        [
          {
            actionType: useUnstableAction
              ? 'sanity.action.release.publish2'
              : 'sanity.action.release.publish',
            releaseId: getReleaseIdFromReleaseDocumentId(releaseId),
          },
        ],
        {
          dryRun: true,
          skipCrossDatasetReferenceValidation: true,
        },
      )

      return true
    } catch (e) {
      return false
    }
  }
  return {
    canPublish: canPublish,
    canSchedule: canSchedule,
  }
}
