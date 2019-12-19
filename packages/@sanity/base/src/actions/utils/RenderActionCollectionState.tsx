import * as React from 'react'
import {ActionState} from './createAction'

interface RenderActionCollectionProps {
  actions: any[]
  args: any
  onReset: (id: string) => void
  component: React.ComponentType<{actionStates: ActionState[]}>
}

export function RenderActionCollectionState(props: RenderActionCollectionProps) {
  const [actionsWithStates, setActionsWithState] = React.useState([])
  const [key, setKey] = React.useState(0)
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

  const {actions, args, component: Component, ...rest} = props
  return (
    <>
      <Component
        actionStates={actionsWithStates.map(([action, state]) => state)}
        onReset={() => setKey(key => key + 1)}
        {...rest}
      />
      {props.actions.map(Action => (
        <Action key={`${key}-${Action.id}`} args={props.args} onUpdate={onStateChange} />
      ))}
    </>
  )
}
