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
import {defer, firstValueFrom, from, NEVER, Subject, type Observable} from 'rxjs'
import {catchError, mergeMap, take, tap} from 'rxjs/operators'
import {
  ConfigErrorContext,
  type ConfigErrorValue,
  LoggedOutReasonContext,
  StudioErrorHandlerContext,
  WorkspacesContext,
} from 'sanity/_singletons'

import {type Config, prepareConfig} from '../../config'
import {getApiErrorCode, isInvalidSessionError} from '../requestErrors/classify'
import {createRequestErrorChannel} from '../requestErrors/createRequestErrorChannel'
import {
  createRequestFailureProbe,
  type RequestFailureResult,
} from '../requestErrors/diagnoseRequestFailure'
import {RequestErrorDialog} from '../requestErrors/RequestErrorDialog'
import {type CorsCheckCache, checkCors} from './corsCheck'
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
  token?: string
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

/**
 * Outcome of the `/check/cors` probe:
 *  - a {@link CorsCheckResult} — the allow/credentials verdict
 *  - `'project-not-found'` — the probe itself 404s because the project
 *    doesn't exist (`errorCode: "SIO-404-PNF"`). This is the one place we
 *    can detect a missing project: the CORS endpoint answers with CORS
 *    headers (so the `fetch` resolves) but a 404 body, whereas the data
 *    API requests fail as opaque network/CORS errors that can't tell us
 *    why.
 *  - `null` — inconclusive (network down, endpoint down, no projectId)
 *
 * @internal
 */
export type CorsProbeOutcome = CorsCheckResult | 'project-not-found'

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
  token,
}: WorkspacesProviderProps) {
  const [corsError, setCorsError] = useState<CorsErrorState>()
  const [configError, setConfigError] = useState<ConfigErrorValue>()
  const [corsRetry, onCorsRetry] = useObservableEventHandler()

  // Per-mount cache — module scope would bleed across studios mounted on
  // the same page, HMR reloads, and tests.
  const corsCache = useMemo<CorsCheckCache>(
    () => new QuickLRU({maxAge: 1000 * 60 * 2, maxSize: 200}),
    [],
  )

  // Channel for call-site-delegated request errors. Created before the
  // workspaces resolve (it's threaded into `prepareConfig` so the auth
  // store can use it during boot). The forced-logout effect below reads
  // the workspace list lazily through this ref to find the auth store to
  // tear down.
  const workspacesRef = useRef<WorkspacesContextValue | null>(null)
  const [requestErrorChannel] = useState(() => createRequestErrorChannel())

  // Apply a diagnosed config/CORS failure to the screen-takeover state. Shared
  // by the request handler and the auth store's `/users/me` probe (via
  // `requestFailureDiagnostics`), so both surface the same UI for the same
  // diagnosis. Takes the failing client so it can read its projectId/dataset.
  const applyRequestFailure = useCallback(
    (result: Exclude<RequestFailureResult, {type: 'unknown'}>, client: SanityClient) => {
      const clientConfig = client.config()
      const isStaging = Boolean(clientConfig.apiHost?.endsWith('.work'))
      if (result.type === 'cors') {
        // A CORS misconfiguration (allowlist missing the origin or disallowing
        // credentials) — can begin at any time, e.g. an admin editing the
        // allowlist in Manage.
        setConfigError(undefined)
        setCorsError({
          isStaging,
          projectId: clientConfig.projectId,
          allowed: result.allowed,
          withCredentials: result.withCredentials,
        })
        return
      }
      // A configuration error (missing project/dataset) makes the whole
      // workspace unusable and can't be recovered by retry — the user has to
      // fix their config. Take over the screen with guidance.
      setConfigError({
        error: {
          type: result.type === 'dataset-not-found' ? 'datasetNotFound' : 'projectNotFound',
        },
        isStaging,
        projectId: clientConfig.projectId,
        dataset: clientConfig.dataset,
      })
    },
    [],
  )

  // The request handler does two global things, both outside any caller's
  // reach:
  //  1. CORS / config detection: a misconfigured origin or a missing
  //     project/dataset makes the studio unusable and no plugin can recover
  //     from it — the studio claims this UX, replacing the workspace render
  //     with a guided full-screen view.
  //  2. invalid-session 401 → forced logout: only 401s the API explicitly
  //     tags as an invalid session (`SIO-401-AEX` expired, `SIO-401-ANF` not
  //     found — both sent by every endpoint) are handled globally.
  //     Untagged 401s are resource-level denials (some endpoints answer
  //     401, not 403, for authenticated users lacking a grant) and
  //     re-surface to the caller like any other caller-domain error.
  //
  // Everything else — network errors, 5xx, 429 — propagates to the caller
  // unchanged. Callers that cannot recover locally delegate explicitly via
  // `useStudioErrorHandler()`; the studio never decides on their behalf.
  const requestHandler: RequestHandler = useCallback(
    (requestOptions, originalRequest, client) => {
      return defer(() => originalRequest(requestOptions)).pipe(
        catchError((requestError: unknown, caught) => {
          // An invalid-session 401 means the session is no longer
          // authenticated. Hand it to the channel — it claims the
          // `unauthorized` state once, driving the forced logout below —
          // and park this request, since the session is being torn down.
          if (isInvalidSessionError(requestError)) {
            void requestErrorChannel.handle(requestError)
            return NEVER
          }

          // Diagnose config (missing project/dataset) and CORS failures with
          // the shared probe — the same diagnosis the auth store's `/users/me`
          // probe uses, so both agree regardless of which request fails first.
          return from(createRequestFailureProbe(client, corsCache)(requestError)).pipe(
            mergeMap((result) => {
              if (result.type === 'unknown') {
                // Not a config/CORS failure — re-throw so it surfaces normally.
                throw requestError
              }

              applyRequestFailure(result, client)

              // For a CORS misconfig the view polls and resolves itself: when
              // `onCorsRetry` fires we resubscribe to `caught`.
              if (result.type === 'cors') {
                return corsRetry.pipe(
                  take(1),
                  mergeMap(() => caught.pipe(tap(() => setCorsError(undefined)))),
                )
              }

              // Config error: park (never emit) rather than re-throw. The
              // takeover screen replaces the workspace render, so the failed
              // request has nowhere useful to go — and re-throwing would
              // propagate into a live store subscription's render path (e.g.
              // switching between two misconfigured workspaces), tripping the
              // error boundary.
              return NEVER
            }),
          )
        }),
      )
    },
    [applyRequestFailure, corsCache, corsRetry, requestErrorChannel],
  )

  // Diagnostics for the auth store's `/users/me` probe, which runs on a client
  // with this request handler stripped and so can't rely on it for CORS /
  // config detection. Same classifier + the same screen-takeover side effect.
  const requestFailureDiagnostics = useMemo(
    () => ({
      diagnose: (err: unknown, client: SanityClient) =>
        createRequestFailureProbe(client, corsCache)(err),
      onRequestFailure: (
        result: Exclude<RequestFailureResult, {type: 'unknown'}>,
        client: SanityClient,
      ) => applyRequestFailure(result, client),
    }),
    [applyRequestFailure, corsCache],
  )

  const workspaces = useDeferredValue(
    prepareConfig(config, {
      basePath,
      token,
      requestHandler,
      requestErrorChannel,
      requestFailureDiagnostics,
    }).workspaces satisfies WorkspacesContextValue,
    null,
  )

  useEffect(() => {
    // Ref mutation from an effect (not during render) — safe under
    // concurrent rendering.
    workspacesRef.current = workspaces
  }, [workspaces])

  // `null` initial value (rather than undefined) so react-rx provides a
  // server snapshot — SSR renders without a dialog instead of warning
  // about a missing getServerSnapshot.
  const claim = useObservable(requestErrorChannel.claim$, null) ?? undefined

  // Why we logged the user out, consumed by the login screen to surface a
  // toast. Derived from the live `unauthorized` claim, so it's present exactly
  // while the forced-logout state is — and clears on re-login (no persistence).
  // The reason mirrors the API's invalid-session code so the toast copy can
  // be accurate: "expired" only when the API actually said expired.
  const loggedOutReason =
    claim?.type === 'unauthorized'
      ? getApiErrorCode(claim.error) === 'SIO-401-AEX'
        ? 'session-expired'
        : 'session-not-found'
      : undefined

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

  // CORS: full-screen takeover replaces the workspace render. Skipped when
  // a config error is active — a missing project/dataset takes precedence
  // (it can't be fixed by adding a CORS origin) and is rendered lower in
  // the tree via `ConfigErrorContext`, where the workspace-switcher hooks
  // are available.
  if (corsError && !configError) {
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
            // `null` (inconclusive) or `'project-not-found'` — keep the
            // screen up; neither is a resolved CORS allowlist.
            if (result === null || result === 'project-not-found') return true
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
      <ConfigErrorContext.Provider value={configError ?? null}>
        <StudioErrorHandlerContext.Provider value={requestErrorChannel}>
          <LoggedOutReasonContext.Provider value={loggedOutReason}>
            {/* A config error (missing project/dataset) and a request-error
                claim can fire from the same boot failure — the data request
                network-errors (claimed here) while the `/check/cors` probe
                separately resolves it to project-not-found. The config-error
                takeover wins, so suppress the dialog while one is active. */}
            {!configError && claim && claim.type !== 'unauthorized' && (
              <RequestErrorDialog claim={claim} onRetry={requestErrorChannel.retry} />
            )}
            {children}
          </LoggedOutReasonContext.Provider>
        </StudioErrorHandlerContext.Provider>
      </ConfigErrorContext.Provider>
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
