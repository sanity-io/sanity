import {useLayoutEffect, useState} from 'react'

/**
 * `false` on the render that mounts the calling component, and `true` from the render that follows
 * its first commit, which React runs synchronously, before the browser paints.
 *
 * An overlay that can mount already open (the nav drawer, the first time it is opened) reads its
 * open state through this, so `useViewTransitionValue` opens it in a transition of its own type,
 * like every later open. Shown in the commit that mounts it, its typed boundaries would make that
 * commit start a view transition that animates nothing.
 *
 * @internal
 */
export function useMountCommitted(): boolean {
  const [committed, setCommitted] = useState(false)
  // oxlint-disable-next-line react/set-state-in-effect -- the second, synchronous commit is the point
  useLayoutEffect(() => setCommitted(true), [])
  return committed
}
