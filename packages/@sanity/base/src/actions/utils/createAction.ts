import * as React from 'react'

let id = 0
const getId = () => id++
interface ActionProps {
  docState: {}
}

interface ActionComponent {
  (props: ActionProps): ActionState
}
export interface ActionState {
  id: string
  label: string
}

interface ActionWrapperProps extends ActionProps {
  onUpdate: (updateDispatch: [React.ComponentType<any>, ActionState | null]) => void
  args: any
}

export function createAction(action: ActionComponent) {
  const id = getId()

  // Note: React.memo is required here to avoid infinite render loops
  const Action = React.memo(function Action_(props: ActionWrapperProps) {
    const {onUpdate, args} = props
    const state = action(args)
    onUpdate([Action, state ? {id, ...state} : null])
    return null
  })

  // @ts-ignore
  Action.id = id
  return Action
}
