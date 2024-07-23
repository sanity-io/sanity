import {memo, type ReactNode} from 'react'
import {
  type DocumentActionDescription,
  type DocumentActionGroup,
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
  actionProps: Omit<DocumentActionProps, 'onComplete'>
  children: (props: {states: DocumentActionDescription[]}) => ReactNode
  onActionComplete?: () => void
  group?: DocumentActionGroup
}

/** @internal */
export const RenderActionCollectionState = memo((props: RenderActionCollectionProps) => {
  const {actions, children, actionProps, onActionComplete, group} = props

  return (
    <GetHookCollectionState<Omit<DocumentActionProps, 'onComplete'>, DocumentActionDescription>
      onReset={onActionComplete}
      hooks={actions}
      args={actionProps}
      group={group}
    >
      {children}
    </GetHookCollectionState>
  )
})
RenderActionCollectionState.displayName = 'Memo(RenderActionCollectionState)'
