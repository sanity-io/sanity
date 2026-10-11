import {type HTMLProps, type ReactNode, useMemo, type RefAttributes} from 'react'
import {StateLink} from 'sanity/router'

import {useInactiveToolState} from '../../../mountedTools/useInactiveToolState'

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
  // A tool kept mounted while inactive (`beta.reactActivityMode`) links back to the
  // state it was last at, so returning to it restores its URL rather than its start page.
  const inactiveToolState = useInactiveToolState(name)
  const state = useMemo(
    () =>
      inactiveToolState ?? {
        tool: name,
        // make sure to clear tool state when navigating to another tool
        [name]: undefined,
      },
    [inactiveToolState, name],
  )

  return <StateLink state={state} {...rest} ref={ref} />
}
