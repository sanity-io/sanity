import {
  BehaviorSubject,
  combineLatest,
  defer,
  distinctUntilChanged,
  fromEvent,
  map,
  NEVER,
  type Observable,
  of,
  type OperatorFunction,
  shareReplay,
  startWith,
  Subject,
  switchMap,
  takeUntil,
  tap,
  timer,
} from 'rxjs'

/**
 * How long a page must stay hidden before its listeners disconnect. Shorter tab switches keep
 * their connections, so coming back to the tab needs no resync.
 *
 * @internal
 */
export const LISTENER_PAUSE_GRACE_PERIOD = 30_000

/**
 * `localStorage` key that overrides {@link LISTENER_PAUSE_GRACE_PERIOD} with a number of
 * milliseconds, for debugging and end-to-end tests.
 *
 * @internal
 */
export const LISTENER_PAUSE_GRACE_PERIOD_STORAGE_KEY = '_sanity_listenerPauseGracePeriod'

/** @internal */
export interface PauseWhileDocumentHiddenOptions<P> {
  /**
   * Returns a value to emit in place of the events of a listener that disconnects because the
   * page was hidden, such as `{type: 'reconnect'}`. It is not called when the page is already
   * hidden at subscription, since the listener has not connected yet.
   */
  onPause?: () => P
}

/**
 * Decides when Studio's listeners may hold a connection open. Browsers cap the number of
 * concurrent connections per origin, which every Studio tab shares, so a page that has been
 * hidden for longer than the grace period gives its listener connections up, and takes them
 * back when it is shown again.
 *
 * @internal
 */
export interface ListenerGate {
  /** Whether listeners may be connected. Emits synchronously on subscription. */
  active$: Observable<boolean>
  /** Turns pausing on or off. While off, listeners are always active. */
  setEnabled: (enabled: boolean) => void
  /**
   * Keeps every listener connected, hidden page or not, until the returned function is called.
   * Calling the returned function more than once has no further effect.
   */
  acquireHold: () => () => void
  /**
   * Subscribes to the source while listeners are active and unsubscribes from it while they are
   * paused, which closes the connection of a listener. Every resume is a new subscription, so put
   * this where a fresh subscription resyncs its consumer (a listener's `welcome` event).
   *
   * A source that completes or errors ends the gated stream.
   */
  pauseWhileDocumentHidden: <T, P = never>(
    options?: PauseWhileDocumentHiddenOptions<P>,
  ) => OperatorFunction<T, T | P>
}

/** @internal */
export interface ListenerGateOptions {
  /** Read every time the page is hidden. Defaults to {@link getListenerPauseGracePeriod}. */
  getGracePeriod?: () => number
}

/**
 * The grace period in milliseconds: {@link LISTENER_PAUSE_GRACE_PERIOD}, unless `localStorage`
 * holds a non-negative number under {@link LISTENER_PAUSE_GRACE_PERIOD_STORAGE_KEY}.
 *
 * @internal
 */
export function getListenerPauseGracePeriod(): number {
  try {
    const override = localStorage.getItem(LISTENER_PAUSE_GRACE_PERIOD_STORAGE_KEY)
    const gracePeriod = override === null || override.trim() === '' ? NaN : Number(override)
    return Number.isFinite(gracePeriod) && gracePeriod >= 0
      ? gracePeriod
      : LISTENER_PAUSE_GRACE_PERIOD
  } catch {
    return LISTENER_PAUSE_GRACE_PERIOD
  }
}

function isDocumentVisible(): boolean {
  return typeof document === 'undefined' || document.visibilityState !== 'hidden'
}

const documentVisible$: Observable<boolean> = defer(() =>
  typeof document === 'undefined'
    ? of(true)
    : fromEvent(document, 'visibilitychange').pipe(
        map(isDocumentVisible),
        startWith(isDocumentVisible()),
      ),
).pipe(distinctUntilChanged())

/** @internal */
export function createListenerGate(options: ListenerGateOptions = {}): ListenerGate {
  const {getGracePeriod = getListenerPauseGracePeriod} = options
  const enabled$ = new BehaviorSubject(false)
  const holds$ = new BehaviorSubject(0)

  const pausedForVisibility$ = documentVisible$.pipe(
    switchMap((visible, index) => {
      if (visible) return of(false)
      // Hidden from the start, such as a tab opened in the background: nothing has connected
      // yet, so nothing waits for the grace period to connect and disconnect again.
      if (index === 0) return of(true)
      return timer(getGracePeriod()).pipe(
        map(() => true),
        startWith(false),
      )
    }),
  )

  const active$ = combineLatest([
    enabled$.pipe(distinctUntilChanged()),
    holds$.pipe(
      map((holds) => holds > 0),
      distinctUntilChanged(),
    ),
    pausedForVisibility$,
  ]).pipe(
    map(([enabled, held, pausedForVisibility]) => !enabled || held || !pausedForVisibility),
    distinctUntilChanged(),
    shareReplay({bufferSize: 1, refCount: true}),
  )

  function acquireHold() {
    holds$.next(holds$.value + 1)
    let released = false
    return () => {
      if (released) return
      released = true
      holds$.next(holds$.value - 1)
    }
  }

  function pauseWhileDocumentHidden<T, P = never>(
    pauseOptions: PauseWhileDocumentHiddenOptions<P> = {},
  ): OperatorFunction<T, T | P> {
    const {onPause} = pauseOptions
    return (source) =>
      defer(() => {
        // A source that completes by itself (a listener rejected for an invalid session) is
        // done: it must not connect again the next time the page is shown.
        const sourceCompleted$ = new Subject<void>()
        return active$.pipe(
          switchMap((active, index): Observable<T | P> => {
            if (active) {
              return source.pipe(tap({complete: () => sourceCompleted$.next()}))
            }
            // `active$` only emits changes, so a pause after the first value follows a connection
            return index > 0 && onPause ? of(onPause()) : NEVER
          }),
          takeUntil(sourceCompleted$),
        )
      })
  }

  return {
    active$,
    setEnabled: (enabled) => enabled$.next(enabled),
    acquireHold,
    pauseWhileDocumentHidden,
  }
}

/**
 * The gate every Studio listener shares, since the connection limit is per page, not per
 * workspace. Disabled until the active workspace turns it on.
 *
 * @internal
 */
export const listenerGate: ListenerGate = createListenerGate()

/**
 * {@link ListenerGate.pauseWhileDocumentHidden} of the shared {@link listenerGate}.
 *
 * @internal
 */
export const pauseWhileDocumentHidden: ListenerGate['pauseWhileDocumentHidden'] =
  listenerGate.pauseWhileDocumentHidden
