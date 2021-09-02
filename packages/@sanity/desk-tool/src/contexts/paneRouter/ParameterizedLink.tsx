import {StateLink} from '@sanity/base/router'
import React, {forwardRef, useContext, useMemo} from 'react'
import {PaneRouterContext} from './PaneRouterContext'

interface ParameterizedLinkProps {
  params?: Record<string, string>
  payload?: unknown
  children?: React.ReactNode
}

/**
 * @internal
 */
export const ParameterizedLink = forwardRef(function ParameterizedLink(
  props: ParameterizedLinkProps,
  ref: React.ForwardedRef<HTMLAnchorElement>
) {
  const {params: newParams, payload: newPayload, ...rest} = props
  const {routerPanesState} = useContext(PaneRouterContext)

  const panes = routerPanesState.map((group, i) => {
    if (i !== routerPanesState.length - 1) {
      return group
    }

    const pane = group[0]
    return [
      {
        ...pane,
        params: newParams || pane.params,
        payload: newPayload || pane.payload,
      },
      ...group.slice(1),
    ]
  })

  const state = useMemo(() => ({panes}), [panes])

  return <StateLink ref={ref} {...rest} state={state} />
})
