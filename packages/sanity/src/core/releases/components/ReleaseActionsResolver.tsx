import {type ReleaseDocument} from '@sanity/client'
import {memo, type ReactNode, useEffect} from 'react'

import {GetHookCollectionState} from '../../components/hookCollection'
import {
  type ReleaseActionComponent,
  type ReleaseActionDescription,
} from '../../config/releases/actions'
import {type DocumentInRelease} from '../tool/detail/useBundleDocuments'

export interface ReleaseActionsResolverProps {
  actions: ReleaseActionComponent[]
  release: ReleaseDocument
  documents: DocumentInRelease[]
  onActions: (actions: ReleaseActionDescription[]) => void
  children?: (props: {states: ReleaseActionDescription[]}) => ReactNode
}

const ReleaseActionsStateHandler = memo(function ReleaseActionsStateHandler({
  states,
  onActions,
  renderChildren,
}: {
  states: ReleaseActionDescription[]
  onActions: (actions: ReleaseActionDescription[]) => void
  renderChildren?: (props: {states: ReleaseActionDescription[]}) => ReactNode
}) {
  useEffect(() => {
    onActions(states)
  }, [states, onActions])

  return renderChildren ? renderChildren({states}) : null
})

/**
 * The `ReleaseActionsResolver` component is responsible for resolving the actions for a given release.
 *
 * This component uses the `GetHookCollectionState` pattern to efficiently manage action hook states,
 * providing performance optimizations and consistent behaviour with document actions.
 *
 * @internal
 */
export const ReleaseActionsResolver = memo(function ReleaseActionsResolver(
  props: ReleaseActionsResolverProps,
) {
  const {actions, release, documents, onActions, children} = props

  const actionProps = {
    release,
    documents,
  }

  return (
    <GetHookCollectionState<typeof actionProps, ReleaseActionDescription>
      hooks={actions}
      args={actionProps}
    >
      {({states}) => (
        <ReleaseActionsStateHandler
          states={states}
          onActions={onActions}
          renderChildren={children}
        />
      )}
    </GetHookCollectionState>
  )
})
