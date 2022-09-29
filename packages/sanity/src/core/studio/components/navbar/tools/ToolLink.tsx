import React, {forwardRef, useMemo} from 'react'
import {StateLink, useRouterState} from 'sanity/router'

/** @beta */
export interface ToolLinkProps {
  children: React.ReactNode
  name: string
}

/** @beta */
export const ToolLink = forwardRef(function ToolLink(
  props: ToolLinkProps & Omit<React.HTMLProps<HTMLAnchorElement>, 'href' | 'name'>,
  ref: React.ForwardedRef<HTMLAnchorElement>
) {
  const {name, ...rest} = props
  const routerState = useRouterState()

  const state = useMemo(
    () => ({...routerState, tool: name, [name]: undefined}),
    [routerState, name]
  )

  return <StateLink state={state} {...rest} ref={ref} />
})
