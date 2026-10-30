import {memo, type RefObject, useCallback, useEffect, useRef, useState} from 'react'
import {
  catchError,
  EMPTY,
  filter,
  firstValueFrom,
  shareReplay,
  type Subscription,
  switchMap,
  take,
} from 'rxjs'
import {getPublishedId, isRecord, useDocumentStore, useStudioErrorHandler} from 'sanity'
import {useRouter, useRouterState} from 'sanity/router'
import {useEffectEvent} from 'use-effect-event'

import {resolveIntent, type ResolveIntentOptions} from '../../../structureResolvers/resolveIntent'
import {
  applyResolvedIntent,
  createResolvingPanes,
  getResolvingRequest,
  type IntentRequest,
  isResolvingPaneId,
} from '../../../structureResolvers/resolvingPane'
import {type RouterPanes, type UnresolvedPaneNode} from '../../../types'
import {useStructureTool} from '../../../useStructureTool'
import {ensureDocumentIdAndType} from './utils'

const EMPTY_RECORD: Record<string, unknown> = {}

/**
 * How long an intent may take to resolve before its document is opened on its
 * own. It matches the delay before `LoadingPane` shows, so a fast resolution
 * navigates straight to the result without an intermediate state.
 */
const RESOLVING_GRACE_PERIOD_MS = 300

const GRACE_PERIOD_ELAPSED = Symbol('grace period elapsed')

type ResolutionRequest = Omit<ResolveIntentOptions, 'rootPaneNode' | 'structureContext'>

interface PendingResolution {
  key: string
  rootPaneNode: UnresolvedPaneNode
  structureContext: unknown
  resolution: Promise<RouterPanes>
}

/**
 * A settled resolution is only reused by the navigation it was started for, so
 * a later click on the same link searches the structure again.
 */
function forgetResolution(
  pendingRef: RefObject<PendingResolution | null>,
  resolution: Promise<RouterPanes>,
) {
  if (pendingRef.current?.resolution === resolution) pendingRef.current = null
}

/**
 * A component that receives an intent from props and redirects to the resolved
 * intent location. When the resolution takes a while, it opens the document
 * right away in a resolving pane (`__resolve__<id>`) and replaces that pane
 * with the resolved location once it is known.
 */
export const IntentResolver = memo(function IntentResolver() {
  const router = useRouter()
  const {navigate} = router
  const maybeIntent = useRouterState(
    useCallback((routerState) => {
      const intentName = typeof routerState.intent === 'string' ? routerState.intent : undefined
      return intentName
        ? {
            intent: intentName,
            params: isRecord(routerState.params) ? routerState.params : EMPTY_RECORD,
            payload: routerState.payload,
          }
        : undefined
    }, []),
  )
  const resolvingPaneId = useRouterState(
    useCallback((routerState) => {
      const id = (routerState.panes as RouterPanes | undefined)?.[0]?.[0]?.id
      return id && isResolvingPaneId(id) ? id : undefined
    }, []),
  )
  const {rootPaneNode, structureContext} = useStructureTool()
  const documentStore = useDocumentStore()
  const errorHandler = useStudioErrorHandler()
  const [error, setError] = useState<unknown>(null)
  const pendingRef = useRef<PendingResolution | null>(null)

  // this re-throws errors so that parent ErrorBoundary's can handle them properly
  if (error) throw error

  // the same resolution serves the intent state and the resolving pane that
  // replaces it, so moving from one to the other doesn't start it again
  const getResolution = useEffectEvent((request: ResolutionRequest): Promise<RouterPanes> => {
    // keyed without the type, which the intent state may only know as a pending lookup
    const key = `${request.intent}:${request.params.id}`
    const pending = pendingRef.current
    if (
      pending &&
      pending.key === key &&
      pending.rootPaneNode === rootPaneNode &&
      pending.structureContext === structureContext
    ) {
      return pending.resolution
    }

    const resolution = resolveIntent({...request, rootPaneNode, structureContext})
    const entry: PendingResolution = {key, rootPaneNode, structureContext, resolution}
    pendingRef.current = entry
    // a failed resolution is started again when the request-error dialog retries it
    resolution.catch(() => forgetResolution(pendingRef, entry.resolution))
    return resolution
  })

  const getCurrentPanes = useEffectEvent(() => (router.state.panes || []) as RouterPanes)

  // oxlint-disable-next-line consistent-return
  useEffect(() => {
    if (maybeIntent) {
      const {intent, params, payload} = maybeIntent

      let cancelled = false
      let documentPreload: Subscription | undefined
      async function effect() {
        // The request-error dialog's "Try again" can re-run this thunk after
        // the effect has been cleaned up (intent changed or unmounted) —
        // resolve immediately instead of re-fetching for a stale intent.
        if (cancelled) return

        const {id, type} = ensureDocumentIdAndType(
          documentStore,
          typeof params.id === 'string' ? params.id : undefined,
          typeof params.type === 'string' ? params.type : undefined,
        )
        // looked up once for the preload, the resolution and the resolving pane
        const documentType$ = type.pipe(take(1), shareReplay({bufferSize: 1, refCount: false}))

        // the document pane shares this load once it opens, so it doesn't start from scratch
        documentPreload?.unsubscribe()
        documentPreload = documentType$
          .pipe(
            filter(Boolean),
            switchMap((resolvedType) =>
              documentStore.pair.editState(getPublishedId(id), resolvedType),
            ),
            catchError(() => EMPTY),
          )
          .subscribe()

        const resolution = getResolution({
          intent,
          params: {...params, id},
          documentType: documentType$,
          payload,
        })
        let timer: ReturnType<typeof setTimeout> | undefined
        const result = await Promise.race([
          resolution,
          new Promise<typeof GRACE_PERIOD_ELAPSED>((resolve) => {
            timer = setTimeout(resolve, RESOLVING_GRACE_PERIOD_MS, GRACE_PERIOD_ELAPSED)
          }),
        ]).finally(() => clearTimeout(timer))

        if (cancelled) return

        if (result === GRACE_PERIOD_ELAPSED) {
          const documentType = await firstValueFrom(documentType$)
          if (cancelled) return

          const request: IntentRequest = {
            intent,
            params: {...params, id, type: documentType},
            payload,
          }
          navigate({panes: createResolvingPanes(request)}, {replace: true})
          return
        }

        forgetResolution(pendingRef, resolution)
        navigate({panes: result}, {replace: true})
      }

      // Delegate infrastructure failures (network, 5xx, 429) to the studio's request-error
      // dialog, whose "Try again" re-runs the resolution.
      errorHandler.attempt(effect, {retryable: true}).catch(setError)

      return () => {
        cancelled = true
        documentPreload?.unsubscribe()
      }
    }
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- `getResolution` is an effect event, which react-hooks/exhaustive-deps forbids listing
  }, [documentStore, errorHandler, maybeIntent, navigate])

  // oxlint-disable-next-line consistent-return
  useEffect(() => {
    if (resolvingPaneId) {
      const paneId = resolvingPaneId
      let cancelled = false
      async function effect() {
        if (cancelled) return

        const request = getResolvingRequest(getCurrentPanes())
        if (!request) return

        const resolution = getResolution(request)
        const resolvedPanes = await resolution
        forgetResolution(pendingRef, resolution)

        // the effect is cleaned up when the user navigates away from the
        // resolving pane, and the resolution is then dropped
        if (cancelled) return

        const nextPanes = applyResolvedIntent(getCurrentPanes(), paneId, resolvedPanes)
        if (nextPanes) {
          navigate({panes: nextPanes}, {replace: true})
        }
      }

      errorHandler.attempt(effect, {retryable: true}).catch(setError)

      return () => {
        cancelled = true
      }
    }
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- `getResolution` and `getCurrentPanes` are effect events, which react-hooks/exhaustive-deps forbids listing
  }, [errorHandler, navigate, resolvingPaneId])

  return null
})
