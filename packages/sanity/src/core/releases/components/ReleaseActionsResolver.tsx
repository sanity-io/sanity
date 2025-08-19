import {type ReleaseDocument} from '@sanity/client'
import {memo, type ReactNode, useEffect, useMemo} from 'react'

import {GetHookCollectionState} from '../../components/hookCollection'
import {
  type ReleaseActionComponent,
  type ReleaseActionDescription,
  type ReleaseActionGroup,
} from '../../config/releases/actions'
import {ReleaseActionContextProvider} from '../contexts/ReleaseActionContext'
import {type DocumentInRelease} from '../tool/detail/useBundleDocuments'

export interface ReleaseActionsResolverProps {
  actions: ReleaseActionComponent[]
  release: ReleaseDocument
  documents: DocumentInRelease[]
  onActions: (actions: ReleaseActionDescription[]) => void
  children?: (props: {states: ReleaseActionDescription[]}) => ReactNode
  group?: ReleaseActionGroup
}

const ReleaseActionsStateHandler = memo(function ReleaseActionsStateHandler({
  states,
  onActions,
  renderChildren,
  group,
}: {
  states: ReleaseActionDescription[]
  onActions: (actions: ReleaseActionDescription[]) => void
  renderChildren?: (props: {states: ReleaseActionDescription[]}) => ReactNode
  group?: ReleaseActionGroup
}) {
  // Filter actions based on group, treating actions without groups as appearing everywhere
  const filteredStates = useMemo(() => {
    if (!group) return states

    return states.filter((state) => {
      // If no group is specified on the action, it should appear in both list and detail
      if (!state.group || state.group.length === 0) {
        return true
      }
      // If group is specified, check if the current context is included
      return state.group.includes(group)
    })
  }, [states, group])

  useEffect(() => {
    onActions(filteredStates)
  }, [filteredStates, onActions])

  return renderChildren ? renderChildren({states: filteredStates}) : null
})

/**
 * The `ReleaseActionsResolver` component is responsible for resolving the actions for a given release.
 *
 * This component uses the `GetHookCollectionState` pattern to efficiently manage action hook states,
 * providing performance optimizations and consistent behaviour with document actions.
 *
 * Actions without a group property will appear in both list and detail contexts by default.
 * Actions with explicit groups will only appear in those contexts.
 *
 * @internal
 */
export const ReleaseActionsResolver = memo(function ReleaseActionsResolver(
  props: ReleaseActionsResolverProps,
) {
  const {actions, release, documents, onActions, children, group} = props

  const actionProps = {
    release,
    documents,
  }

  return (
    <ReleaseActionContextProvider value={{group}}>
      <GetHookCollectionState<typeof actionProps, ReleaseActionDescription>
        hooks={actions}
        args={actionProps}
        // Don't pass group to GetHookCollectionState - we'll handle filtering manually
      >
        {({states}) => (
          <ReleaseActionsStateHandler
            states={states}
            onActions={onActions}
            renderChildren={children}
            group={group}
          />
        )}
      </GetHookCollectionState>
    </ReleaseActionContextProvider>
  )
})
