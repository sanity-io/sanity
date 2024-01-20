import {type ForwardedRef, forwardRef, type HTMLProps, type ReactNode, useCallback} from 'react'
import {StateLink, useRouterState} from 'sanity/router'

/**
 * @hidden
 * @beta */
export interface ToolLinkProps {
  children: ReactNode
  name: string
}

/**
 * @hidden
 * @beta */
export const ToolLink = forwardRef(function ToolLink(
  props: ToolLinkProps & Omit<HTMLProps<HTMLAnchorElement>, 'href' | 'name'>,
  ref: ForwardedRef<HTMLAnchorElement>,
) {
  const {name, ...rest} = props
  const state = useRouterState(
    useCallback(
      () => ({
        tool: name,
        // make sure to clear tool state when navigating to another tool
        [name]: undefined,
      }),
      [name],
    ),
  )

  return <StateLink state={state} {...rest} ref={ref} />
})
