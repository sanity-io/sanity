import {
  ClientError,
  type HttpRequestEvent,
  type RequestHandler,
  type SanityClient,
  ServerError,
} from '@sanity/client'
import isNativeNetworkError from 'is-network-error'
import QuickLRU from 'quick-lru'
import {
  type ComponentType,
  type ReactNode,
  useCallback,
  useDeferredValue,
  useMemo,
  useState,
} from 'react'
import {defer, from, type Observable, of, Subject, throwError} from 'rxjs'
import {catchError, map, mergeMap, take, tap} from 'rxjs/operators'
import {WorkspacesContext} from 'sanity/_singletons'

import {type Config, prepareConfig} from '../../config'
import {CorsOriginErrorScreen} from './CorsOriginErrorScreen'
import {type HandledError, RequestErrorDialog} from './RequestErrorDialog'
import {type WorkspacesContextValue} from './WorkspacesContext'

/** @internal */
export interface WorkspacesProviderProps {
  config: Config
  children: ReactNode
  basePath?: string
  LoadingComponent: ComponentType
}

function isTimeoutError(error: unknown): error is Error & {code: 'ESOCKETTIMEDOUT' | 'ETIMEDOUT'} {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error.code === 'ESOCKETTIMEDOUT' || error.code === 'ETIMEDOUT')
  )
}

function isNetworkError(error: unknown): error is Error {
  if (typeof error !== 'object' || error === null) return false
  // get-it sets isNetworkError=true on connection errors
  // https://github.com/sanity-io/get-it/blob/9ffc7e0c2d41ffcfd3a33e7525d9d1f6b188f812/src/request/browser-request.ts#L194
  if ('isNetworkError' in error && error.isNetworkError === true) return true
  // get-it's connect/socket timeout path publishes a plain Error with a code
  // but does not set isNetworkError. Treat these timeouts as network errors
  // so they go through the same retry flow as other connection failures.
  if (isTimeoutError(error)) return true
  return isNativeNetworkError(error)
}

const corsCheck = new QuickLRU<string, Promise<boolean>>({maxAge: 1000 * 60 * 2, maxSize: 200})

function checkCors(_client: SanityClient) {
  const {projectId, apiHost} = _client.config()
  if (!projectId) {
    return Promise.resolve(true)
  }
  // Cache by projectId+apiHost so staging/prod (or any apiHost variants) don't collide
  const cacheKey = `${projectId}@${apiHost ?? ''}`
  const cached = corsCheck.get(cacheKey)
  if (cached) {
    return cached
  }
  // this is just a probe, so don't retry
  const client = _client.withConfig({maxRetries: 1})
  // todo: should be replaced with a cors-check endpoint
  const check = Promise.allSettled([
    client.request({
      withCredentials: false,
      url: '/ping',
      tag: 'cors-check',
    }),
    client.request({url: '/auth/id', tag: 'cors-check'}),
  ]).then(([ping, user]) => {
    // ping request succeeded, but user request was network error so likely the CORS origin is disallowed
    return ping.status === 'fulfilled' && user.status === 'rejected' && isNetworkError(user.reason)
  })
  corsCheck.set(cacheKey, check)
  return check
}

/**
 * Classify a request error into one of the displayable error types, or `null`
 * if it should bubble up to the nearest ErrorBoundary. Returns an Observable
 * because the network-error path needs to probe CORS asynchronously.
 *
 * Classification by error class first — CORS-blocked responses can't reach
 * here as ClientError/ServerError because the browser never delivers the
 * response body to JS. So if we *have* a typed error, the response made it
 * through and CORS is fine. Only probe for the bare-network-error bucket
 * where CORS-blocked and offline are genuinely indistinguishable in the
 * error object.
 */
function classifyRequestError(err: unknown, client: SanityClient): Observable<HandledError | null> {
  if (err instanceof ClientError) return of({type: 'clientError', error: err})
  if (err instanceof ServerError) return of({type: 'serverError', error: err})
  if (!isNetworkError(err)) return of(null)

  // Skip the CORS probe for timeouts: a timeout means the request never got
  // a response, and the probe would have to wait for its own timeout before
  // resolving. CORS misconfig surfaces as an immediate network error, not a
  // timeout, so this short-circuit doesn't lose detection — and it gets the
  // user to the retry dialog quickly.
  if (isTimeoutError(err)) return of({type: 'networkError', error: err})

  return from(checkCors(client)).pipe(
    map((invalidCorsConfig) =>
      invalidCorsConfig
        ? {
            type: 'cors',
            isStaging: Boolean(client.config().apiHost?.endsWith('.work')),
            projectId: client.config()?.projectId,
          }
        : {type: 'networkError', error: err},
    ),
  )
}

/** @internal */
export function WorkspacesProvider({
  config,
  children,
  basePath,
  LoadingComponent,
}: WorkspacesProviderProps) {
  const [error, setError] = useState<HandledError>()

  const [retry, onRetry] = useObservableEventHandler()

  const requestHandler: RequestHandler = useCallback(
    (requestOptions, originalRequest, client) => {
      // Wait for the user to click "Try again", clear the error state, then
      // re-subscribe to `caught` so the retry flows back through this same
      // catchError — meaning a second failure gets classified again.
      const waitForRetry = (caught: Observable<HttpRequestEvent>) =>
        retry.pipe(
          take(1),
          tap(() => setError(undefined)),
          mergeMap(() => caught),
        )

      return defer(() => originalRequest(requestOptions)).pipe(
        catchError((requestError: unknown, caught) =>
          classifyRequestError(requestError, client).pipe(
            // Unclassified → propagate so the nearest ErrorBoundary handles it.
            mergeMap((handled) =>
              handled === null ? throwError(() => requestError) : of(handled),
            ),
            // Side effect: set state. CORS is the dominant problem when
            // present, so don't let a later, less-specific error overwrite
            // a CORS error already displayed.
            tap((handled) =>
              setError((prev) =>
                prev?.type === 'cors' && handled.type !== 'cors' ? prev : handled,
              ),
            ),
            mergeMap(() => waitForRetry(caught)),
          ),
        ),
      )
    },
    [retry],
  )

  const workspaces = useDeferredValue(
    prepareConfig(config, {basePath, requestHandler}).workspaces satisfies WorkspacesContextValue,
    null,
  )

  // The first workspace's projectId, used by CorsOriginErrorScreen to decide
  // whether to surface the "Register studio" option (only valid when the
  // failing project matches the studio's primary project).
  const primaryProjectId = useMemo(() => {
    const first = Array.isArray(config) ? config[0] : config
    return first?.projectId
  }, [config])

  if (workspaces === null) {
    return <LoadingComponent />
  }

  // CORS is a config problem, not a transient network blip — show the full
  // registration/dev-host screen instead of an overlay dialog so the user has
  // a clear path to fix it.
  if (error?.type === 'cors') {
    return (
      <CorsOriginErrorScreen
        projectId={error.projectId}
        isStaging={error.isStaging}
        primaryProjectId={primaryProjectId}
      />
    )
  }

  return (
    <WorkspacesContext.Provider value={workspaces}>
      {error && <RequestErrorDialog error={error} onRetry={onRetry} />}
      {children}
    </WorkspacesContext.Provider>
  )
}

function useObservableEventHandler<T = void>(): [Observable<T>, (event: T) => void] {
  const [subject] = useState(() => new Subject<T>())
  const callback = useCallback(
    (value: T) => {
      subject.next(value)
    },
    [subject],
  )

  const observable = useMemo(() => {
    return subject.asObservable()
  }, [subject])

  return [observable, callback]
}
