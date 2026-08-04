import {type ComponentType, useContext, useMemo, type RefAttributes} from 'react'
import {PaneRouterContext} from 'sanity/_singletons'
import {StateLink} from 'sanity/router'

import {type BackLinkProps} from './types'

/**
 * @internal
 */
export const BackLink = function BackLink(props: BackLinkProps & RefAttributes<HTMLAnchorElement>) {
  const {ref, ...rest} = props
  const {routerPanesState, groupIndex} = useContext(PaneRouterContext)
  const panes = useMemo(() => routerPanesState.slice(0, groupIndex), [groupIndex, routerPanesState])
  const state = useMemo(() => ({panes}), [panes])

  return <StateLink {...rest} ref={ref} state={state} />
} as ComponentType<BackLinkProps>
