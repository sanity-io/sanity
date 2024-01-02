import React, {forwardRef, useContext, useMemo} from 'react'
import {PaneRouterContext} from './PaneRouterContext'
import {BackLinkProps} from './types'
import {StateLink} from 'sanity/router'

/**
 * @internal
 */
export const BackLink = forwardRef(function BackLink(
  props: BackLinkProps,
  ref: React.ForwardedRef<HTMLAnchorElement>,
) {
  const {routerPanesState, groupIndex} = useContext(PaneRouterContext)
  const panes = useMemo(() => routerPanesState.slice(0, groupIndex), [groupIndex, routerPanesState])
  const state = useMemo(() => ({panes}), [panes])

  return <StateLink {...props} ref={ref} state={state} />
}) as React.ComponentType<BackLinkProps>
