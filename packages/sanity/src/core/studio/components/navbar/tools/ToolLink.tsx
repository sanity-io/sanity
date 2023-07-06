import React, {forwardRef, useCallback} from 'react'
import {StateLink, useRouterState} from 'sanity/router'

/**
 * @hidden
 * @beta */
export interface ToolLinkProps {
  children: React.ReactNode
  name: string
}

/**
 * @hidden
 * @beta */
export const ToolLink = forwardRef(function ToolLink(
  props: ToolLinkProps & Omit<React.HTMLProps<HTMLAnchorElement>, 'href' | 'name'>,
  ref: React.ForwardedRef<HTMLAnchorElement>
) {
  const {name, ...rest} = props
  const state = useRouterState(
    useCallback((routerState) => ({...routerState, tool: name, [name]: undefined}), [name])
  )

  return <StateLink state={state} {...rest} ref={ref} />
})
