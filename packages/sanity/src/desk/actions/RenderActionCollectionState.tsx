import React from 'react'
import {GetHookCollectionState} from '../../core'
import {DocumentActionDescription, DocumentActionProps} from './types'

interface Action<Args, Description> {
  (args: Args): Description | null
}

interface RenderActionCollectionProps {
  actions: Action<DocumentActionProps, DocumentActionDescription>[]
  actionProps: DocumentActionProps
  children: (props: {states: DocumentActionDescription[]}) => React.ReactNode
  onActionComplete?: () => void
}

export const RenderActionCollectionState = (props: RenderActionCollectionProps) => {
  const {actions, children, actionProps, onActionComplete} = props

  return (
    <GetHookCollectionState onReset={onActionComplete} hooks={actions} args={actionProps}>
      {children}
    </GetHookCollectionState>
  )
}
