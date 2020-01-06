import * as React from 'react'
import {ActionDescription} from './types'

interface RenderActionCollectionProps {
  actions: any[]
  actionProps: any
  onActionComplete: () => void
  component: (args: {actionStates: ActionDescription[]}) => React.ReactNode
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

  const {actions, actionProps, component, ...rest} = props
  return (
    <>
      {component({
        actionStates: actionsWithStates
          .map(([id, state]) => state && {...state, actionId: id})
          .filter(Boolean),
        ...rest
      })}

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
