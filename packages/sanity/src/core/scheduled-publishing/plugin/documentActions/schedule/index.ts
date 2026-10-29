import {type DocumentActionComponent} from '../../../../config/document/actions'
import {type DocumentActionsContext} from '../../../../config/types'
import {useScheduleAction} from './ScheduleAction'

type Action = DocumentActionComponent

export default function resolveDocumentActions(
  existingActions: Action[],
  context: DocumentActionsContext,
): Action[] {
  if (context.versionType === 'published') {
    return existingActions
  }

  // Add schedule action after default publish action
  const index = existingActions.findIndex((a) => a.action === 'publish')
  if (index < 0) {
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    return [useScheduleAction, ...existingActions]
  }
  return existingActions.flatMap((action) =>
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    action.action === 'publish' ? [action, useScheduleAction] : action,
  )
}
