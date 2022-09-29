import React from 'react'
import {
  type DocumentActionDescription,
  type DocumentActionProps,
  GetHookCollectionState,
} from 'sanity'

/** @internal */
export interface Action<Args, Description> {
  (args: Args): Description | null
}

/** @internal */
export interface RenderActionCollectionProps {
  actions: Action<DocumentActionProps, DocumentActionDescription>[]
  actionProps: DocumentActionProps
  children: (props: {states: DocumentActionDescription[]}) => React.ReactNode
  onActionComplete?: () => void
}

/** @internal */
export const RenderActionCollectionState = (props: RenderActionCollectionProps) => {
  const {actions, children, actionProps, onActionComplete} = props

  return (
    <GetHookCollectionState onReset={onActionComplete} hooks={actions} args={actionProps}>
      {children}
    </GetHookCollectionState>
  )
}
