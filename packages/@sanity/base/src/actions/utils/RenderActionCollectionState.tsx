import React from 'react'
import type {DocumentActionDescription, DocumentActionProps} from './types'
import {GetHookCollectionState} from './GetHookCollectionState'

interface Action<Args, Description> {
  (args: Args): Description
}

interface RenderActionCollectionProps {
  actions: Action<DocumentActionProps, DocumentActionDescription>[]
  actionProps: DocumentActionProps
  onActionComplete: () => void
  component: (args: {states: DocumentActionDescription[]}) => React.ReactNode
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
