import {useContext, useEffect, useRef} from 'react'
import {type Observable} from 'rxjs'
import {ActivityKeepAliveContext} from 'sanity/_singletons'

/**
 * Keeps `observable` subscribed while the tool rendering the component is hidden in an
 * `<Activity>` boundary (see `beta.reactActivityMode`), so the shared source behind it is not
 * torn down and started over, with its loading state, when the tool is shown again. Call it
 * before the hook that subscribes to `observable`, so the keep-alive takes over before that
 * subscription is cleaned up on hide. Does nothing outside a mounted tool.
 *
 * @internal
 */
export function useKeepAliveWhileHidden(observable: Observable<unknown>): void {
  const keepAlive = useContext(ActivityKeepAliveContext)
  // What this instance handed over on hide. A hidden tool still re-renders when context changes,
  // so `observable` may be another one by the time the effect runs again on reveal; the one that
  // was retained has to be released too, or it would be held until the next cycle's sweep.
  const retainedRef = useRef<Observable<unknown> | null>(null)

  useEffect(() => {
    if (!keepAlive) return undefined
    if (retainedRef.current) keepAlive.release(retainedRef.current)
    retainedRef.current = null
    keepAlive.release(observable)
    return () => {
      retainedRef.current = observable
      keepAlive.retain(observable)
    }
  }, [keepAlive, observable])
}
