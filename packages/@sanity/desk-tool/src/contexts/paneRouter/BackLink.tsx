import {StateLink} from '@sanity/base/router'
import React, {forwardRef, useContext, useMemo} from 'react'
import {PaneRouterContext} from './PaneRouterContext'

interface BackLinkProps {
  children?: React.ReactNode
}

/**
 * @internal
 */
export const BackLink = forwardRef(function BackLink(
  props: BackLinkProps,
  ref: React.ForwardedRef<HTMLAnchorElement>
) {
  const {routerPanesState, groupIndex} = useContext(PaneRouterContext)
  const panes = useMemo(() => routerPanesState.slice(0, groupIndex), [groupIndex, routerPanesState])
  const state = useMemo(() => ({panes}), [panes])

  return <StateLink {...props} ref={ref} state={state} />
})
