import * as React from 'react'

let id = 0
const getId = () => id++

interface ActionComponent<ActionProps> {
  (props: ActionProps): ActionState
}
export interface ActionState {
  id: number
  label: string
}

interface ActionWrapperProps<ActionProps extends {}> {
  onUpdate: (updateDispatch: [number, ActionState | null]) => void
  onComplete: (id: number) => void
  actionProps: ActionProps
}

function getDisplayName(component) {
  return component.displayName || component.name || '<anonymous>'
}

export function createAction<ActionProps>(action: ActionComponent<ActionProps>) {
  const id = getId()

  function ActionStateContainer(props: ActionWrapperProps<ActionProps>) {
    const {onUpdate, onComplete, actionProps} = props

    const state = action({...actionProps, onComplete: () => onComplete(id)})
    onUpdate([id, state ? {...state, id} : null])
    return null
  }

  ActionStateContainer.displayName = `ActionStateContainer(${getDisplayName(action)})`
  // Note: React.memo is required here to avoid infinite render loops

  const Action = React.memo(ActionStateContainer)

  // @ts-ignore
  Action.id = id
  return Action
}
