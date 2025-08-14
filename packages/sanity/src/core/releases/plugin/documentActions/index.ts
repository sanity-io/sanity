import {type DocumentActionComponent} from '../../../config/document/actions'
import {type DocumentActionsContext} from '../../../config/types'
import {DiscardVersionAction} from './DiscardVersionAction'
import {SchedulePublishAction} from './SchedulePublishAction'
import {ScheduleUnpublishAction} from './ScheduleUnpublishAction'
import {UnpublishVersionAction} from './UnpublishVersionAction'

type Action = DocumentActionComponent

export default function resolveDocumentActions(
  existingActions: Action[],
  context: DocumentActionsContext,
): Action[] {
  const duplicateAction = existingActions.filter(({action}) => action === 'duplicate')

  if (context.versionType === 'version') {
    return duplicateAction.concat(DiscardVersionAction, UnpublishVersionAction)
  }

  // Add SchedulePublishAction and ScheduleUnpublishAction only for draft documents
  if (context.__internal_releasesEnabled && context.versionType === 'draft') {
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

    return [
      ...actionsBeforePublish,
      SchedulePublishAction,
      ScheduleUnpublishAction,
      ...actionsAfterPublish,
    ]
  }
  return existingActions
}
