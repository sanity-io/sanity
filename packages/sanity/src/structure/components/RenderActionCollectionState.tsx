import {memo, useContext} from 'react'
import {
  type DocumentActionComponent,
  type DocumentActionDescription,
  type DocumentActionGroup,
} from 'sanity'
import {DocumentActionsStateContext} from 'sanity/_singletons'

/** @internal */
export interface Action<Args, Description> {
  (args: Args): Description | null
}
export interface ResolvedAction extends DocumentActionDescription {
  action?: DocumentActionComponent['action']
}

/** @internal */
export interface RenderActionCollectionProps {
  children: (props: {states: ResolvedAction[]}) => React.ReactNode
  group?: DocumentActionGroup
}

/** @internal */
export const RenderActionCollectionState = memo((props: RenderActionCollectionProps) => {
  const {children, group} = props
  const states = useContext(DocumentActionsStateContext)

  if (states === null) {
    throw new Error('DocumentActionsStateContext is not set. This should not happen.')
  }

  const filteredStates = group
    ? states.filter((state) => {
        const hookGroup = state.group || ['default']
        return hookGroup.includes(group)
      })
    : states

  return children({states: filteredStates})
})
RenderActionCollectionState.displayName = 'Memo(RenderActionCollectionState)'
