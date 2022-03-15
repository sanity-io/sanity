import {Router} from '@sanity/state-router'
import {isEqual} from 'lodash'
import {Observable, of} from 'rxjs'
import {
  map,
  filter,
  scan,
  publishReplay,
  refCount,
  catchError,
  distinctUntilChanged,
} from 'rxjs/operators'
import {SanityTool} from '../../config'
import {LocationStore} from './location'
import {decodeUrlState, isNonNullable, resolveDefaultState, resolveIntentState} from './helpers'
import {RouterEvent} from './types'

export function createRouterEventStream(
  locationStore: LocationStore,
  hasSpaces: boolean,
  spaces: string[] | undefined,
  tools: SanityTool[],
  router: Router
): Observable<RouterEvent> {
  function maybeHandleIntent(prevEvent: RouterEvent | null, currentEvent: RouterEvent) {
    if (currentEvent?.type === 'state' && currentEvent.state?.intent) {
      const redirectState = resolveIntentState(
        hasSpaces,
        spaces,
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
      const defaultState = resolveDefaultState(hasSpaces, spaces, tools, event.state)

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
    catchError((err) => of({type: 'error', error: err})),
    publishReplay(1),
    refCount()
  )

  return state$
}
