import * as React from 'react'
import {ActionState} from './createAction'

interface RenderActionCollectionProps {
  actions: any[]
  actionProps: any
  onActionComplete: () => void
  component: React.ComponentType<{actionStates: ActionState[]}>
}

export function RenderActionCollectionState(props: RenderActionCollectionProps) {
  const [actionsWithStates, setActionsWithState] = React.useState([])

  const [keys, setKey] = React.useState({})
  const handleComplete = React.useCallback(
    id => {
      setKey(keys => ({...keys, [id]: (keys[id] || 0) + 1}))
      props.onActionComplete()
    },
    [props.actions]
  )

  const onStateChange = React.useCallback(
    stateUpdate => {
      setActionsWithState(prevState => {
        return props.actions.map((action: any) =>
          stateUpdate[0] === action.id
            ? [action.id, stateUpdate[1]]
            : prevState.find(prev => prev[0] === action.id) || [action.id]
        )
      })
    },
    [props.actions]
  )

  const {actions, actionProps, component: Component, ...rest} = props
  return (
    <>
      <Component
        actionStates={actionsWithStates.map(([id, state]) => state).filter(Boolean)}
        {...rest}
      />
      {props.actions.map(Action => (
        <Action
          key={`${keys[Action.id] || '0'}-${Action.id}`}
          actionProps={props.actionProps}
          onUpdate={onStateChange}
          onComplete={handleComplete}
        />
      ))}
    </>
  )
}
