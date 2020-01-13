/* eslint-disable react/no-multi-comp */
import * as React from 'react'
import {ActionDescription} from './types'

interface RenderActionCollectionProps {
  actions: any[]
  actionProps: any
  onActionComplete: () => void
  component: (args: {actionStates: ActionDescription[]}) => React.ReactNode
}

const actionIds = new WeakMap()

let counter = 0
const getActionId = action => {
  if (actionIds.has(action)) {
    return actionIds.get(action)
  }
  const id = `${action.name || action.displayName || '<anonymous>'}-${counter++}`
  actionIds.set(action, id)
  return id
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
        return props.actions.map((action: any) => {
          const id = getActionId(action)
          return stateUpdate[0] === id
            ? [id, stateUpdate[1]]
            : prevState.find(prev => prev[0] === id) || [id]
        })
      })
    },
    [props.actions]
  )

  const {actions: _, actionProps, component, ...rest} = props

  return (
    <>
      {component({
        actionStates: actionsWithStates
          .map(([id, state]) => state && {...state, actionId: id})
          .filter(Boolean),
        ...rest
      })}

      {props.actions.map(action => {
        const actionId = getActionId(action)
        return (
          <ActionStateContainer
            key={`${actionId}-${keys[actionId] || '0'}`}
            action={action}
            id={actionId}
            actionProps={props.actionProps}
            onUpdate={onStateChange}
            onComplete={handleComplete}
          />
        )
      })}
    </>
  )
}

const ActionStateContainer = React.memo(function ActionStateContainer(props: any) {
  const {id, action, onUpdate, onComplete, actionProps} = props

  const state = action({...actionProps, onComplete: () => onComplete(id)})
  onUpdate([id, state ? state : null])
  return null
})
