import {useTelemetry} from '@sanity/telemetry/react'
import {useEffectEvent, useLayoutEffect} from 'react'
import {skip, tap} from 'rxjs'

import {listenerGate} from '../../store/listenerGate/listenerGate'
import {useWorkspace} from '../workspace'
import {
  ListenersPaused,
  ListenersResumed,
  type ListenersResumedData,
} from './__telemetry__/listenerGate.telemetry'

/**
 * Turns the shared listener gate on for a workspace with `beta.releaseBackgroundListeners`, and
 * releases it again when the workspace unmounts. The gate counts who turned it on, so it stays on
 * while another Studio on the page still has it on. Reports when the listeners pause and resume.
 *
 * @internal
 */
export function ListenerGateController(): null {
  const {beta} = useWorkspace()
  const enabled = beta?.releaseBackgroundListeners?.enabled === true
  const telemetry = useTelemetry()
  const reportPaused = useEffectEvent(() => telemetry.log(ListenersPaused))
  const reportResumed = useEffectEvent((data: ListenersResumedData) =>
    telemetry.log(ListenersResumed, data),
  )

  // A layout effect, so the gate is configured before the workspace's listeners subscribe: they
  // subscribe from passive effects, and React runs every layout effect of a commit first. A tab
  // opened in the background then never connects them.
  useLayoutEffect(() => {
    if (!enabled) return undefined
    const release = listenerGate.enable()

    // Subscribed once the gate is on and unsubscribed before it is turned off, so turning it on
    // or off is never reported as a pause or a resume
    let pausedAt: number | undefined
    const subscription = listenerGate.active$
      .pipe(
        // The state at mount is no transition either: a page opened in the background starts
        // paused, and its first connection is no resume
        skip(1),
        tap((active) => {
          if (!active) {
            pausedAt = performance.now()
            reportPaused()
            return
          }
          if (pausedAt === undefined) return
          reportResumed({
            pausedDurationMs: Math.round(performance.now() - pausedAt),
            reason: document.visibilityState === 'hidden' ? 'hold' : 'visible',
          })
          pausedAt = undefined
        }),
      )
      .subscribe()
    return () => {
      subscription.unsubscribe()
      release()
    }
  }, [enabled])

  return null
}
