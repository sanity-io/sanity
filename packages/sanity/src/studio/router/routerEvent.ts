import {escapeRegExp, isEqual} from 'lodash'
import {Observable} from 'rxjs'
import {map, filter, scan, shareReplay, distinctUntilChanged} from 'rxjs/operators'
import {History, Location} from 'history'
import {Tool} from '../../config'
import {Router} from '../../router'
import {decodeUrlState, isNonNullable, resolveDefaultState, resolveIntentState} from './helpers'
import {RouterEvent} from './types'

interface RouterEventStreamOptions {
  unstable_history: History
  router: Router
  tools: Tool[]
}

/**
 * @internal
 */
export function createRouterEventStream({
  unstable_history: history,
  router,
  tools,
}: RouterEventStreamOptions): Observable<RouterEvent> {
  function maybeHandleIntent(prevEvent: RouterEvent | null, currentEvent: RouterEvent) {
    if (currentEvent?.type === 'state' && currentEvent.state?.intent) {
      const redirectState = resolveIntentState(
        tools,
        prevEvent?.type === 'state' ? prevEvent.state : {},
        currentEvent.state
      )

      if (redirectState?.type === 'state') {
        history.replace(router.encode(redirectState.state))
        return null
      }
    }

    return currentEvent
  }

  function maybeRedirectDefaultState(event: RouterEvent) {
    if (event.type === 'state') {
      const defaultState = resolveDefaultState(tools, event.state)

      if (defaultState && defaultState !== event.state) {
        history.replace(router.encode(defaultState))
        return null
      }
    }

    return event
  }

  const routerBasePath = router.getBasePath()

  const state$: Observable<RouterEvent> = new Observable<Location>((observer) => {
    history.listen((location) => observer.next(location))

    // emit on mount
    observer.next(history.location)
  }).pipe(
    // this is necessary to prevent emissions intended for other workspaces.
    //
    // this regex ends with a `(\\/|$)` (forward slash or end) to prevent false
    // matches where the pathname is a false subset of the current pathname.
    filter(({pathname}) =>
      routerBasePath === '/'
        ? true
        : new RegExp(`^${escapeRegExp(routerBasePath)}(\\/|$)`, 'i').test(pathname)
    ),
    map(({pathname}) => decodeUrlState(router, pathname)),
    scan(maybeHandleIntent, null),
    filter(isNonNullable),
    map(maybeRedirectDefaultState),
    filter(isNonNullable),
    distinctUntilChanged(isEqual),
    shareReplay(1)
  )

  return state$
}
