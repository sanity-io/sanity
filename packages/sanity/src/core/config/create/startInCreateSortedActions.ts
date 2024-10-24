//this file has to live here to avoid cyclic dependencies between config<->create
import {type DocumentActionComponent} from '../document'

// The "Start in Create" action must be sorted first, so we need a sort key; the action string –
// we also don't want this string in the config interfaces, so we need the cheeky cast to smuggle it through
export const START_IN_CREATE_ACTION_NAME =
  'startInCreate' as unknown as DocumentActionComponent['action']

/**
 * Sorts "Start in Create" action first, when present
 */
export function getStartInCreateSortedActions(
  actions: DocumentActionComponent[],
): DocumentActionComponent[] {
  return [...actions].sort((a, b) => {
    if (a.action === START_IN_CREATE_ACTION_NAME) {
      return -1
    } else if (b.action === START_IN_CREATE_ACTION_NAME) {
      return 1
    }
    return 0
  })
}
