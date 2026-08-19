import {type HTMLProps, type ReactNode, useCallback, type RefAttributes} from 'react'
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
export function ToolLink(
  props: ToolLinkProps &
    Omit<HTMLProps<HTMLAnchorElement>, 'href' | 'name'> &
    RefAttributes<HTMLAnchorElement>,
) {
  const {ref, name, ...rest} = props
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
}
