import {useLayoutEffect} from 'react'

import {listenerGate} from '../../store/listenerGate/listenerGate'
import {useWorkspace} from '../workspace'

/**
 * Turns the shared listener gate on for a workspace with `beta.releaseBackgroundListeners`, and
 * off again when the workspace unmounts.
 *
 * @internal
 */
export function ListenerGateController(): null {
  const {beta} = useWorkspace()
  const enabled = beta?.releaseBackgroundListeners?.enabled === true

  // A layout effect, so the gate is configured before the workspace's listeners subscribe: they
  // subscribe from passive effects, and React runs every layout effect of a commit first. A tab
  // opened in the background then never connects them.
  useLayoutEffect(() => {
    listenerGate.setEnabled(enabled)
    return () => listenerGate.setEnabled(false)
  }, [enabled])

  return null
}
