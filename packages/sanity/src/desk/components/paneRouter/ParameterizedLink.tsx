import React, {forwardRef, useContext, useMemo} from 'react'
import {StateLink} from '../../../router'
import {useUnique} from '../../../util'
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
  const {routerPanesState: currentPanes, groupIndex, siblingIndex} = useContext(PaneRouterContext)
  const {params, payload, ...rest} = props
  const nextParams = useUnique(params)
  const nextPayload = useUnique(payload)

  const nextState = useMemo(() => {
    const currentGroup = currentPanes[groupIndex]
    const currentSibling = currentGroup[siblingIndex]

    const nextSibling = {
      ...currentSibling,
      params: nextParams ?? currentSibling.params,
      payload: nextPayload ?? currentSibling.payload,
    }

    const nextGroup = [
      ...currentGroup.slice(0, siblingIndex),
      nextSibling,
      ...currentGroup.slice(siblingIndex + 1),
    ]

    const nextPanes = [
      ...currentPanes.slice(0, groupIndex),
      nextGroup,
      ...currentPanes.slice(groupIndex + 1),
    ]

    return {panes: nextPanes}
  }, [currentPanes, groupIndex, nextParams, nextPayload, siblingIndex])

  return <StateLink ref={ref} {...rest} state={nextState} />
})
