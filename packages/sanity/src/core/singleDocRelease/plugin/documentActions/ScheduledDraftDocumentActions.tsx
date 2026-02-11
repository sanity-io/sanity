import {type ReleaseDocument} from '@sanity/client'

import {
  type DocumentActionComponent,
  type DocumentActionDescription,
  type DocumentActionProps,
} from '../../../config/document/actions'
import {useAllReleases} from '../../../releases/store/useAllReleases'
import {getReleaseIdFromReleaseDocumentId} from '../../../releases/util/getReleaseIdFromReleaseDocumentId'
import {isPausedCardinalityOneRelease} from '../../../util/releaseUtils'
import {
  useScheduledDraftMenuActions,
  type UseScheduledDraftMenuActionsReturn,
} from '../../hooks/useScheduledDraftMenuActions'

/**
 * Higher-order function that creates a scheduled draft document action
 * @internal
 */
const createScheduledDraftAction = (
  actionKey: keyof UseScheduledDraftMenuActionsReturn['actions'],
  visibilityCheck?: (release: ReleaseDocument | undefined) => boolean,
): DocumentActionComponent => {
  // Using hook naming conventions is required for React Compiler to detect this function and memoize it
  const useScheduledDraftAction: DocumentActionComponent = (
    props: DocumentActionProps,
  ): DocumentActionDescription | null => {
    const {type, release, id} = props
    const {data: releases = [], loading} = useAllReleases()

    const releaseDocument = releases.find(
      (r) => getReleaseIdFromReleaseDocumentId(r._id) === release,
    )

    const {actions, dialogs} = useScheduledDraftMenuActions({
      release: releaseDocument,
      documentType: type,
      documentId: id,
    })

    if (visibilityCheck && !visibilityCheck(releaseDocument)) {
      return null
    }

    // This action is only shown for scheduled-draft version type
    if (!releaseDocument) {
      return null
    }

    if (!actions || !actions[actionKey]) {
      return null
    }

    const actionProps = actions[actionKey]

    return {
      disabled: actionProps.disabled || loading,
      icon: actionProps.icon,
      label: actionProps.text,
      title: actionProps.text,
      tone: actionProps.tone,
      dialog: dialogs
        ? {
            type: 'custom',
            component: dialogs,
          }
        : false,
      onHandle: actionProps.onClick,
    }
  }
  return useScheduledDraftAction
}

/**
 * Document action for publishing a scheduled draft immediately
 * @internal
 */
export const PublishScheduledDraftAction = createScheduledDraftAction('publishNow')

/**
 * Document action for editing schedule of a scheduled draft
 * Only visible when the draft is NOT paused
 * @internal
 */
export const EditScheduledDraftAction = createScheduledDraftAction(
  'editSchedule',
  (release) => !isPausedCardinalityOneRelease(release), // Hide when paused
)

/**
 * Document action for deleting a scheduled draft
 * @internal
 */
export const DeleteScheduledDraftAction = createScheduledDraftAction('deleteSchedule')

PublishScheduledDraftAction.displayName = 'PublishScheduledDraftAction'
PublishScheduledDraftAction.action = 'publish'

EditScheduledDraftAction.displayName = 'EditScheduledDraftAction'
EditScheduledDraftAction.action = 'schedule'

DeleteScheduledDraftAction.displayName = 'DeleteScheduledDraftAction'
DeleteScheduledDraftAction.action = 'discardVersion'
