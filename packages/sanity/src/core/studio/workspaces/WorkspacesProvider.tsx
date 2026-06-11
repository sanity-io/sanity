import {type RequestHandler, type SanityClient} from '@sanity/client'
import QuickLRU from 'quick-lru'
import {
  type ComponentType,
  type ReactNode,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {useObservable} from 'react-rx'
import {defer, firstValueFrom, from, of, Subject, type Observable} from 'rxjs'
import {catchError, mergeMap, take, tap} from 'rxjs/operators'
import {StudioErrorHandlerContext, WorkspacesContext} from 'sanity/_singletons'

import {type Config, prepareConfig} from '../../config'
import {isNetworkError, isTimeoutError} from '../requestErrors/classify'
import {createRequestErrorChannel} from '../requestErrors/createRequestErrorChannel'
import {RequestErrorDialog} from '../requestErrors/RequestErrorDialog'
import {CorsOriginErrorView} from './CorsOriginErrorView'
import {type WorkspacesContextValue} from './WorkspacesContext'

/** @internal */
export interface WorkspacesProviderProps {
  config: Config
  children: ReactNode
  basePath?: string
  LoadingComponent: ComponentType
  /**
   * Project ID of the first workspace in the Studio config. Forwarded to
   * `CorsOriginErrorScreen` so it can surface the "Register Studio" option
   * when the failing project matches the studio's primary project.
   */
  primaryProjectId?: string
}

/**
 * Verdict from `/check/cors` for the current origin against the project's
 * CORS allowlist. Both fields come straight from the endpoint:
 *
 *  - `allowed`: whether the origin is in the allowlist at all.
 *  - `withCredentials`: whether the allowlist entry permits credentialed
 *    requests (the studio always sends them).
 *
 * The studio needs both `true` to function. A `null` probe result means
 * the probe couldn't reach a conclusion (network down, endpoint down, no
 * projectId) — callers should treat that as "not CORS" and let the
 * original error flow to its normal branch.
 *
 * @internal
 */
export type CorsCheckResult = {allowed: boolean; withCredentials: boolean}

type CorsCheckCache = QuickLRU<string, Promise<CorsCheckResult | null>>

function checkCors(
  _client: SanityClient,
  cache: CorsCheckCache,
  options: {force?: boolean} = {},
): Promise<CorsCheckResult | null> {
  const config = _client.config()
  const {projectId, apiHost, url: baseUrl} = config
  if (!projectId || !baseUrl) return Promise.resolve(null)

  const cacheKey = `${projectId}@${apiHost ?? ''}`
  if (options.force) {
    cache.delete(cacheKey)
  } else {
    const cached = cache.get(cacheKey)
    if (cached) return cached
  }
  // Bypass @sanity/client and hit `/check/cors` with a bare `fetch`. The
  // studio's client adds custom headers (`x-sanity-app`, etc.) that push
  // the request out of the CORS-safe set and force a preflight OPTIONS
  // — but for this probe we want a simple request that bounces straight
  // off the server's CORS policy without extra round trips.
  const probeUrl = `${baseUrl.replace(/\/+$/, '')}/check/cors`
  const check = fetch(probeUrl, {method: 'GET', credentials: 'omit'})
    .then(async (response): Promise<CorsCheckResult | null> => {
      if (!response.ok) return null
      const body = (await response.json().catch(() => null)) as {
        result?: {allowed?: boolean; withCredentials?: boolean}
      } | null
      if (!body) return null
      return {
        allowed: body.result?.allowed === true,
        withCredentials: body.result?.withCredentials === true,
      }
    })
    .catch((): CorsCheckResult | null => null)
    .then((result) => {
      // Only cache conclusive answers; probe failures shouldn't poison
      // subsequent legitimate requests for the full TTL.
      if (result === null) cache.delete(cacheKey)
      return result
    })
  cache.set(cacheKey, check)
  return check
}

interface CorsErrorState {
  isStaging: boolean
  projectId?: string
  allowed: boolean
  withCredentials: boolean
}

/** @internal */
export function WorkspacesProvider({
  config,
  children,
  basePath,
  LoadingComponent,
  primaryProjectId,
}: WorkspacesProviderProps) {
  const [corsError, setCorsError] = useState<CorsErrorState>()
  const [corsRetry, onCorsRetry] = useObservableEventHandler()

  // Per-mount cache — module scope would bleed across studios mounted on
  // the same page, HMR reloads, and tests.
  const corsCache = useMemo<CorsCheckCache>(
    () => new QuickLRU({maxAge: 1000 * 60 * 2, maxSize: 200}),
    [],
  )

  // The request handler only does one global thing, which is outside any
  // caller's reach: CORS detection. A misconfigured origin makes the
  // studio unusable and no plugin can recover from it — the studio always
  // claims this UX, replacing the workspace render with a guided
  // full-screen view.
  //
  // Everything else — network errors, 5xx, 429, 401 — propagates to the
  // caller unchanged. Callers that cannot recover locally delegate
  // explicitly via `useStudioErrorHandler()` / the request-error
  // channel; the studio never decides on their behalf.
  const requestHandler: RequestHandler = useCallback(
    (requestOptions, originalRequest, client) => {
      return defer(() => originalRequest(requestOptions)).pipe(
        catchError((requestError: unknown, caught) => {
          // Skip the probe for timeouts (the probe itself would time out).
          // `null` from the probe means "couldn't conclude" — re-throw the
          // original error.
          const corsProbe$ =
            isNetworkError(requestError) && !isTimeoutError(requestError)
              ? from(checkCors(client, corsCache))
              : of<CorsCheckResult | null>(null)

          return corsProbe$.pipe(
            mergeMap((corsResult) => {
              // The studio needs the origin allowed AND credentials
              // enabled. If both are true, the CORS endpoint is satisfied
              // — whatever caused the network error wasn't CORS.
              const isMisconfig =
                corsResult !== null && !(corsResult.allowed && corsResult.withCredentials)
              if (!isMisconfig) {
                throw requestError
              }
              setCorsError({
                isStaging: Boolean(client.config().apiHost?.endsWith('.work')),
                projectId: client.config().projectId,
                allowed: corsResult.allowed,
                withCredentials: corsResult.withCredentials,
              })
              // The CORS view polls and resolves itself. When it does,
              // `onCorsRetry` fires and we resubscribe to `caught`.
              return corsRetry.pipe(
                take(1),
                mergeMap(() =>
                  caught.pipe(
                    tap(() => {
                      setCorsError(undefined)
                    }),
                  ),
                ),
              )
            }),
          )
        }),
      )
    },
    [corsCache, corsRetry],
  )

  // Channel for call-site-delegated request errors. Created before the
  // workspaces resolve (it's threaded into `prepareConfig` so the auth
  // store can use it during boot); the 401 resolver reads the workspace
  // list lazily through a ref.
  const workspacesRef = useRef<WorkspacesContextValue | null>(null)
  const [requestErrorChannel] = useState(() =>
    createRequestErrorChannel({
      // A delegated 401 doesn't always mean the session is gone — it can
      // be resource-level (project RBAC, wrong credentials in a
      // multi-workspace setup). Probe `/auth/id` via the matching
      // workspace's auth store before the destructive logout.
      resolveUnauthorized: async (_error, projectId) => {
        const current = workspacesRef.current
        const target = projectId ? current?.find((ws) => ws.projectId === projectId) : current?.[0]
        const probe = target?.auth.probeUnauthenticated
        // No probe available — trust the 401 and log out (previous studio
        // behavior).
        if (!probe) return 'logout'
        const result = await probe()
        return result === 'unauthenticated' ? 'logout' : 'propagate'
      },
    }),
  )

  const workspaces = useDeferredValue(
    prepareConfig(config, {basePath, requestHandler, requestErrorChannel})
      .workspaces satisfies WorkspacesContextValue,
    null,
  )

  useEffect(() => {
    // Ref mutation from an effect (not during render) — safe under
    // concurrent rendering, but the React Compiler immutability check
    // can't verify that. Disable for this single line.
    // eslint-disable-next-line react-hooks/immutability
    workspacesRef.current = workspaces
  }, [workspaces])

  // `null` initial value (rather than undefined) so react-rx provides a
  // server snapshot — SSR renders without a dialog instead of warning
  // about a missing getServerSnapshot.
  const claim = useObservable(requestErrorChannel.claim$, null) ?? undefined

  // Fire forced logout on a verified `unauthorized` claim. Done in an
  // effect so the logout call doesn't run during a render commit.
  useEffect(() => {
    if (claim?.type !== 'unauthorized') return
    const current = workspacesRef.current
    if (!current) return
    // Auth is project-scoped — any workspace matching the projectId has
    // the right credentials and the right logout endpoint. First match
    // wins; in practice all workspaces for the same project share an
    // auth store anyway.
    const target = claim.projectId
      ? current.find((ws) => ws.projectId === claim.projectId)
      : current[0]
    if (!target?.auth.logout) return
    target.auth.logout().catch((logoutErr) => {
      // The logout request itself failed (likely network). The channel's
      // dedupe prevents recursion; just log so a dev can diagnose.
      console.warn('[sanity] Forced logout failed:', logoutErr)
    })
  }, [claim])

  const handleCorsResolved = useCallback(() => {
    // Recheck succeeded — clear the error and let `caught` resubscribe.
    setCorsError(undefined)
    onCorsRetry()
  }, [onCorsRetry])

  if (workspaces === null) {
    return <LoadingComponent />
  }

  // CORS: full-screen takeover replaces the workspace render.
  if (corsError) {
    return (
      <CorsOriginErrorView
        event={{
          isStaging: corsError.isStaging,
          projectId: corsError.projectId,
          allowed: corsError.allowed,
          withCredentials: corsError.withCredentials,
          // Recheck against the first matching workspace's client. If we
          // can't find one, the polling loop keeps showing the screen.
          // Returns `true` while still misconfigured. Resolved when the
          // endpoint reports both `allowed` and `withCredentials` true.
          recheck: async () => {
            const target = corsError.projectId
              ? workspaces.find((ws) => ws.projectId === corsError.projectId)
              : workspaces[0]
            if (!target) return true
            const {client} = await firstValueFrom(target.auth.state)
            const result = await checkCors(client, corsCache, {force: true})
            if (result === null) return true
            return !(result.allowed && result.withCredentials)
          },
        }}
        onResolved={handleCorsResolved}
        primaryProjectId={primaryProjectId}
      />
    )
  }

  return (
    <WorkspacesContext.Provider value={workspaces}>
      <StudioErrorHandlerContext.Provider value={requestErrorChannel}>
        {claim && claim.type !== 'unauthorized' && (
          <RequestErrorDialog claim={claim} onRetry={requestErrorChannel.retry} />
        )}
        {children}
      </StudioErrorHandlerContext.Provider>
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
