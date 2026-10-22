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
  // PROPOSED (Studio-wide): opening another document in the same pane slot keeps the open inspector (its `inspect` param), so switching
  // documents leaves the inspector's frame in place and only its content changes. A link that sets its own `inspect` wins.
  const inspect = routerPanesState[groupIndex + 1]?.[0]?.params?.inspect
  const params =
    inspect && childParameters?.inspect === undefined
      ? {...childParameters, inspect}
      : childParameters

  return (
    <StateLink
      {...rest}
      ref={ref}
      state={{
        panes: [
          ...routerPanesState.slice(0, groupIndex + 1),
          [{id: childId, params, payload: childPayload}],
        ],
      }}
    />
  )
}
