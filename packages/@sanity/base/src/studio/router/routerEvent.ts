import {isEqual} from 'lodash'
import {Observable} from 'rxjs'
import {map, filter, scan, shareReplay, distinctUntilChanged} from 'rxjs/operators'
import {Tool} from '../../config'
import {Router} from '../../router'
import {LocationStore} from './location'
import {decodeUrlState, isNonNullable, resolveDefaultState, resolveIntentState} from './helpers'
import {RouterEvent} from './types'

interface RouterEventStreamOptions {
  locationStore: LocationStore
  router: Router
  tools: Tool[]
}

export function createRouterEventStream({
  locationStore,
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
        const newUrl = router.encode(redirectState.state)

        locationStore.navigate.call({
          path: newUrl,
          replace: true,
        })

        return null
      }
    }

    return currentEvent
  }

  function maybeRedirectDefaultState(event: RouterEvent) {
    if (event.type === 'state') {
      const defaultState = resolveDefaultState(tools, event.state)

      if (defaultState && defaultState !== event.state) {
        locationStore.navigate.call({
          path: router.encode(defaultState),
          replace: true,
        })

        return null
      }
    }

    return event
  }

  const state$: Observable<RouterEvent> = locationStore.event$.pipe(
    map((event) => decodeUrlState(router, event)),
    scan(maybeHandleIntent, null),
    filter(isNonNullable),
    map(maybeRedirectDefaultState),
    filter(isNonNullable),
    distinctUntilChanged(isEqual),
    shareReplay(1)
  )

  return state$
}
