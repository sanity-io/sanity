import {type ForwardedRef, forwardRef, useContext, useMemo} from 'react'
import {PaneRouterContext} from 'sanity/_singletons'
import {StateLink} from 'sanity/router'

import {type ChildLinkProps} from './types'

/**
 * @internal
 */
export const ChildLink = forwardRef(function ChildLink(
  props: ChildLinkProps,
  ref: ForwardedRef<HTMLAnchorElement>,
) {
  const {childId, childPayload, childParameters, ...rest} = props
  const {routerPanesState, groupIndex} = useContext(PaneRouterContext)

  const state = useMemo(
    () => ({
      panes: [
        ...routerPanesState.slice(0, groupIndex + 1),
        [{id: childId, params: childParameters, payload: childPayload}],
      ],
    }),
    [routerPanesState, groupIndex, childId, childParameters, childPayload],
  )

  return <StateLink {...rest} ref={ref} state={state} />
})
