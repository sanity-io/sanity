import {StateLink} from '@sanity/base/router'
import React, {forwardRef, useContext, useMemo} from 'react'
import {PaneRouterContext} from './PaneRouterContext'

interface ChildLinkProps {
  childId: string
  childPayload?: unknown
  children?: React.ReactNode
}

/**
 * @internal
 */
export const ChildLink = forwardRef(function ChildLink(
  props: ChildLinkProps,
  ref: React.ForwardedRef<HTMLAnchorElement>
) {
  const {childId, childPayload, ...rest} = props
  const {routerPanesState, groupIndex} = useContext(PaneRouterContext)
  const panes = useMemo(
    () =>
      routerPanesState.slice(0, groupIndex + 1).concat([[{id: childId, payload: childPayload}]]),
    [childId, childPayload, groupIndex, routerPanesState]
  )
  const state = useMemo(() => ({panes}), [panes])

  return <StateLink {...rest} ref={ref} state={state} />
})
