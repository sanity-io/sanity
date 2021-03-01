/* eslint-disable react/no-multi-comp */
import * as React from 'react'
import {ActionDescription, DocumentActionProps} from './types'
import {GetHookCollectionState} from './GetHookCollectionState'

interface Action<Args, Description> {
  (args: Args): Description
}

interface RenderActionCollectionProps {
  actions: Action<DocumentActionProps, ActionDescription>[]
  actionProps: DocumentActionProps
  onActionComplete: () => void
  component: (args: {states: ActionDescription[]}) => React.ReactNode
}

export function RenderActionCollectionState(props: RenderActionCollectionProps) {
  const {actions, component, actionProps, onActionComplete, ...rest} = props
  return (
    <GetHookCollectionState
      {...rest}
      onReset={onActionComplete}
      hooks={actions}
      args={actionProps}
      component={component}
    />
  )
}
