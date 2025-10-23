import {type DocumentActionComponent} from '../../../config/document/actions'
import {type DocumentActionsContext, QUOTA_EXCLUDED_RELEASES_ENABLED} from '../../../config/types'
import {
  DeleteScheduledDraftAction,
  EditScheduledDraftAction,
  PublishScheduledDraftAction,
} from './ScheduledDraftDocumentActions'
import {SchedulePublishAction} from './SchedulePublishAction'

export default function resolveDocumentActions(
  existingActions: DocumentActionComponent[],
  context: DocumentActionsContext,
): DocumentActionComponent[] {
  if (context.versionType === 'scheduled-draft') {
    // For scheduled draft documents, show only the scheduled draft actions
    return [PublishScheduledDraftAction, EditScheduledDraftAction, DeleteScheduledDraftAction]
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
