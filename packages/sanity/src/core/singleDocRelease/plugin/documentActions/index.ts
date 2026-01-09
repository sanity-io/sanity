import {type DocumentActionComponent} from '../../../config/document/actions'
import {type DocumentActionsContext} from '../../../config/types'
import {
  DeleteScheduledDraftAction,
  EditScheduledDraftAction,
  PublishScheduledDraftAction,
} from './ScheduledDraftDocumentActions'
import {useSchedulePublishAction} from './SchedulePublishAction'

export default function resolveDocumentActions(
  existingActions: DocumentActionComponent[],
  context: DocumentActionsContext,
): DocumentActionComponent[] {
  if (context.versionType === 'scheduled-draft') {
    // For paused scheduled drafts: Schedule (primary), Publish Now, Delete Schedule
    // For active scheduled drafts: Publish Now (primary), Edit Schedule, Delete Schedule
    return [
      useSchedulePublishAction, // Shows only when paused
      PublishScheduledDraftAction, // Always shows
      EditScheduledDraftAction, // Shows only when NOT paused
      DeleteScheduledDraftAction, // Always shows
    ]
  }

  // Add SchedulePublishAction only for draft documents
  if (context.versionType === 'draft') {
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

    return [...actionsBeforePublish, useSchedulePublishAction, ...actionsAfterPublish]
  }
  return existingActions
}
