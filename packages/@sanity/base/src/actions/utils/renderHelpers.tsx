import * as React from 'react'
import {ActionState} from './createAction'

interface RenderActionCollectionProps {
  actions: any[]
  args: any
  children: React.ComponentType<{actionStates: ActionState[]}>
}

export function RenderActionCollectionState(props: RenderActionCollectionProps) {
  const [actionsWithStates, setActionsWithState] = React.useState([])
  const onStateChange = React.useCallback(
    stateUpdate => {
      setActionsWithState(prevState => {
        return props.actions.map((action: any) =>
          stateUpdate[0] === action
            ? [action, stateUpdate[1]]
            : prevState.find(prev => prev[0] === action) || [action]
        )
      })
    },
    [props.actions]
  )
  const Component = props.children
  return (
    <>
      <Component actionStates={actionsWithStates.map(([action, state]) => state)} />
      {props.actions.map(Action => {
        return <Action key={Action.id} args={props.args} onUpdate={onStateChange} />
      })}
    </>
  )
}
