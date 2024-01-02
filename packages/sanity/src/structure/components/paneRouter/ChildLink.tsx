import React, {forwardRef, useContext} from 'react'
import {PaneRouterContext} from './PaneRouterContext'
import {ChildLinkProps} from './types'
import {StateLink} from 'sanity/router'

/**
 * @internal
 */
export const ChildLink = forwardRef(function ChildLink(
  props: ChildLinkProps,
  ref: React.ForwardedRef<HTMLAnchorElement>,
) {
  const {childId, childPayload, childParameters, ...rest} = props
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
})
