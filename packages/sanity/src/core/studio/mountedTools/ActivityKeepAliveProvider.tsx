import {type ReactNode, useEffect, useLayoutEffect, useState} from 'react'
import {ActivityKeepAliveContext} from 'sanity/_singletons'

import {createActivityKeepAlive} from './activityKeepAlive'

interface ActivityKeepAliveProviderProps {
  /** Whether the `<Activity>` boundary rendered inside is hidden */
  hidden: boolean
  children: ReactNode
}

/**
 * Owns the subscriptions a tool keeps alive while hidden (`useKeepAliveWhileHidden`). Rendered
 * around the tool's `<Activity>` boundary: it stays mounted, with its effects running, while the
 * tool is hidden, and unmounts with the tool.
 *
 * @internal
 */
export function ActivityKeepAliveProvider(props: ActivityKeepAliveProviderProps) {
  const {hidden, children} = props
  const [keepAlive] = useState(createActivityKeepAlive)

  // A layout effect, so the flag is set before the hidden subtree's passive effect cleanups
  // retain their subscriptions in the same commit.
  useLayoutEffect(() => {
    keepAlive.setHidden(hidden)
  }, [hidden, keepAlive])

  useEffect(() => {
    if (!hidden) keepAlive.sweep()
  }, [hidden, keepAlive])

  useEffect(() => () => keepAlive.releaseAll(), [keepAlive])

  return (
    <ActivityKeepAliveContext.Provider value={keepAlive}>
      {children}
    </ActivityKeepAliveContext.Provider>
  )
}
