import {type MutationEvent, type ReconnectEvent, type WelcomeEvent} from '@sanity/client'
import {
  catchError,
  connect,
  filter,
  map,
  merge,
  type Observable,
  of,
  type OperatorFunction,
  retry,
  startWith,
  switchMap,
  timer,
} from 'rxjs'

/** The documents a listener reports, as `MutationEvent` requires them */
type ListenerDocument = Record<string, any>

/**
 * The events of a shared listener that a query follows: `welcome`, `reconnect`, and a mutation
 * event carrying the changed document as `result` unless it was deleted.
 *
 * @internal
 */
export type SharedListenerEvent<TResult extends ListenerDocument> =
  | WelcomeEvent
  | ReconnectEvent
  | MutationEvent<TResult>

/**
 * The state of a query on a shared listener, as {@link followListenerQuery} reports it
 *
 * @internal
 */
export type ListenerQueryEvent<TDocument, TResult extends ListenerDocument> =
  | {type: 'loading'}
  | {type: 'loaded'; documents: TDocument[]}
  | {type: 'error'; error: Error}
  | MutationEvent<TResult>

/** @internal */
export type ListenerQueryStatusEvent = Extract<
  ListenerQueryEvent<never, never>,
  {type: 'loading' | 'error'}
>

function isConnectionEvent<TResult extends ListenerDocument>(
  event: SharedListenerEvent<TResult>,
): event is WelcomeEvent | ReconnectEvent {
  return event.type === 'welcome' || event.type === 'reconnect'
}

function isMutationEvent<TResult extends ListenerDocument>(
  event: SharedListenerEvent<TResult>,
): event is MutationEvent<TResult> {
  return event.type === 'mutation'
}

/** How many times a failed fetch is retried before it is reported as an `error` */
const MAX_FETCH_RETRIES = 3

/**
 * Follows a query through the events of a shared listener. On every connection it emits
 * `loading`, then `loaded` with the documents `fetch` returns, and a reconnect cancels a fetch
 * still in flight. A failed fetch is retried, and emits `error` once it has run out of retries.
 * Every mutation is passed on as it arrives, for every document the listener reports, and a
 * failed listener emits `error`.
 *
 * @internal
 */
export function followListenerQuery<TDocument, TResult extends ListenerDocument>(
  fetch: Observable<TDocument[]>,
): OperatorFunction<SharedListenerEvent<TResult>, ListenerQueryEvent<TDocument, TResult>> {
  type Event = ListenerQueryEvent<TDocument, TResult>
  const loading: Event = {type: 'loading'}
  const toError = (error: Error) => of<Event>({type: 'error', error})

  return (events) =>
    events.pipe(
      connect((events$) =>
        merge(
          events$.pipe(
            filter(isConnectionEvent),
            switchMap((event) =>
              event.type === 'reconnect'
                ? of(loading)
                : fetch.pipe(
                    retry({
                      count: MAX_FETCH_RETRIES,
                      delay: (_error: unknown, attempt) => timer(attempt * 1000),
                    }),
                    map((documents): Event => ({type: 'loaded', documents})),
                    catchError(toError),
                    startWith(loading),
                  ),
            ),
          ),
          events$.pipe(filter(isMutationEvent)),
        ),
      ),
      catchError(toError),
    )
}
