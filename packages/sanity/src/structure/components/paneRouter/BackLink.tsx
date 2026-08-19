import {type ComponentType, useContext, useMemo, type RefAttributes} from 'react'
import {type BackLinkProps} from 'sanity'
import {PaneRouterContext} from 'sanity/_singletons'
import {StateLink} from 'sanity/router'

/**
 * @internal
 */
function BackLinkComponent(props: BackLinkProps & RefAttributes<HTMLAnchorElement>) {
  const {ref, ...rest} = props
  const {routerPanesState, groupIndex} = useContext(PaneRouterContext)
  const panes = useMemo(() => routerPanesState.slice(0, groupIndex), [groupIndex, routerPanesState])
  const state = useMemo(() => ({panes}), [panes])

  return <StateLink {...rest} ref={ref} state={state} />
}

export const BackLink = BackLinkComponent as ComponentType<BackLinkProps>
