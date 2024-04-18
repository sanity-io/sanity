import {type DocumentActionComponent} from '../../../../config'
import {ScheduleAction} from './ScheduleAction'

type Action = DocumentActionComponent

export default function resolveDocumentActions(existingActions: Action[]): Action[] {
  // Add schedule action after default publish action
  const index = existingActions.findIndex((a) => a.action === 'publish')
  if (index < 0) {
    return [ScheduleAction, ...existingActions]
  }
  return existingActions.flatMap((action) =>
    action.action === 'publish' ? [action, ScheduleAction] : action,
  )
}
