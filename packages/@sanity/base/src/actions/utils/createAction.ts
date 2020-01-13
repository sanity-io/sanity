import {ActionComponent} from './types'
function getDisplayName(component) {
  return component.displayName || component.name || '<anonymous>'
}

export function createAction<ActionProps>(action: ActionComponent<ActionProps>) {
  console.warn(
    'Calling createAction(%s() {...}) when creating custom document actions is no longer needed',
    getDisplayName(action)
  )
  return action
}
