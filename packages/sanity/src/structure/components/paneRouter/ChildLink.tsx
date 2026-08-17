import {useContext, type RefAttributes} from 'react'
import {PaneRouterContext} from 'sanity/_singletons'
import {StateLink} from 'sanity/router'

import {type ChildLinkProps} from './types'

/**
 * @internal
 */
export function ChildLink(props: ChildLinkProps & RefAttributes<HTMLAnchorElement>) {
  const {ref, childId, childPayload, childParameters, ...rest} = props
  const {routerPanesState, groupIndex} = useContext(PaneRouterContext)

  return (
    <StateLink
      {...rest}
      ref={ref}
      state={{
        panes: [
          ...routerPanesState.slice(0, groupIndex + 1),
          [{id: childId, params: childParameters, payload: childPayload}],
        ],
      }}
    />
  )
}
