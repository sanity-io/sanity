import {type DocumentActionComponent} from '../../../config/document/actions'
import {type DocumentActionsContext, QUOTA_EXCLUDED_RELEASES_ENABLED} from '../../../config/types'
import {DiscardVersionAction} from './DiscardVersionAction'
import {
  DeleteScheduledDraftAction,
  EditScheduledDraftAction,
  PublishScheduledDraftAction,
} from './ScheduledDraftDocumentActions'
import {SchedulePublishAction} from './SchedulePublishAction'
import {UnpublishVersionAction} from './UnpublishVersionAction'

type Action = DocumentActionComponent

export default function resolveDocumentActions(
  existingActions: Action[],
  context: DocumentActionsContext,
): Action[] {
  const duplicateAction = existingActions.filter(({action}) => action === 'duplicate')

  if (context.versionType === 'scheduled-draft') {
    // For scheduled draft documents, show only the scheduled draft actions
    return [PublishScheduledDraftAction, EditScheduledDraftAction, DeleteScheduledDraftAction]
  }

  if (context.versionType === 'version') {
    // For regular version documents, show traditional version actions
    return duplicateAction.concat(DiscardVersionAction, UnpublishVersionAction)
  }

  const isQuotaExcludedReleaseEnabled = context[QUOTA_EXCLUDED_RELEASES_ENABLED]

  // Add SchedulePublishAction only for draft documents
  if (isQuotaExcludedReleaseEnabled && context.versionType === 'draft') {
    const actionsExcludingOriginalSchedule = existingActions.filter(
      ({action}) => action !== 'schedule',
    )
    const publishActionIndex = actionsExcludingOriginalSchedule.findIndex(
      ({action}) => action === 'publish',
    )
    const nextAfterPublishIndex = publishActionIndex + 1
    const hasPublishAction = publishActionIndex >= 0

    const actionsBeforePublish = hasPublishAction
      ? actionsExcludingOriginalSchedule.slice(0, nextAfterPublishIndex)
      : []
    const actionsAfterPublish = hasPublishAction
      ? actionsExcludingOriginalSchedule.slice(nextAfterPublishIndex)
      : actionsExcludingOriginalSchedule

    return [...actionsBeforePublish, SchedulePublishAction, ...actionsAfterPublish]
  }
  return existingActions
}
