import {type DocumentActionComponent} from '../config'
import {START_IN_CREATE_ACTION_NAME} from './start-in-create/StartInCreateAction'

/**
 * Sorts "Start in Create" action first, when present
 */
export function getStartInCreateSortedActions(
  actions: DocumentActionComponent[],
): DocumentActionComponent[] {
  return actions.toSorted((a, b) => {
    if (a.action === START_IN_CREATE_ACTION_NAME) {
      return -1
    } else if (b.action === START_IN_CREATE_ACTION_NAME) {
      return 1
    }
    return 0
  })
}
