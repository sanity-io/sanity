import {SanityEncoder} from '@sanity/mutate'
import {useTelemetry} from '@sanity/telemetry/react'
import {type SanityDocument} from '@sanity/types'
import {fromString, get} from '@sanity/util/paths'
import {useContext, useEffect, useMemo, useState} from 'react'
import {useSyncObservable} from 'react-rx'
import {
  type Observable,
  EMPTY,
  filter,
  find,
  firstValueFrom,
  from,
  map,
  mergeMap,
  of,
  startWith,
  switchMap,
  toArray,
  zip,
} from 'rxjs'
import {DocumentDivergencesContext} from 'sanity/_singletons'
import {useEffectEvent} from 'use-effect-event'

import {useClient} from '../../hooks/useClient'
import {useDocumentOperation} from '../../hooks/useDocumentOperation'
import {useDocumentStore} from '../../store/datastores'
import {selectUpstreamVersion} from '../../store/document/selectUpstreamVersion'
import {getDocumentAtRevision} from '../../store/events/getDocumentAtRevision'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../studioClient'
import {getPublishedId, getVersionFromId} from '../../util/draftUtils'
import {ActedOnDivergence, InspectedDivergence} from '../__telemetry__/divergence.telemetry'
import {type ReachableDivergence} from '../divergenceNavigator'
import {createTakeFromUpstreamPatches, createUpsertResolutionMarkerPatches} from '../patches'
import {createDocumentRevisionMarker, type DivergenceAtPath} from '../readDocumentDivergences'
import {type ResolutionMarkerAtPath} from '../types/ResolutionMarker'
import {hashData} from '../utils/hashData'

type HydratedSnapshot =
  | {
      isLoading: true
      value?: never
    }
  | {
      isLoading: false
      value?: {
        value: unknown
        document: SanityDocument
      }
    }

const LOADING_SNAPSHOT: HydratedSnapshot = {isLoading: true}

/**
 * @internal
 */
export interface DivergenceController {
  /**
   * Resolve the divergence by setting its resolution marker to the current
   * upstream node.
   */
  markResolved: () => Promise<void>
  /**
   * Resolve the divergence by taking the value from the upstream node.
   */
  takeUpstreamValue: () => Promise<void>
  isLoading: boolean
  isReadOnly: boolean
  isActionPending: boolean
  upstreamBase: HydratedSnapshot
  upstreamHead: HydratedSnapshot
}

/**
 * @internal
 */
export function useDivergenceController(
  divergence: ReachableDivergence,
  allDivergences: DivergenceAtPath[],
  contextReadOnly: boolean,
): DivergenceController {
  const {subjectId, documentId, documentType, sinceRevisionId, path} = divergence
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const documentStore = useDocumentStore()
  const telemetry = useTelemetry()
  const [isActionPending, setIsActionPending] = useState<boolean>(false)

  // Why: `useDocumentDivergences` throws outside a `DivergencesProvider`, and
  // the controller can render in trees that lack one. Read the context directly.
  const divergencesContext = useContext(DocumentDivergencesContext)
  const sessionId = divergencesContext?.sessionId ?? null
  // Why: `null` distinguishes "no provider mounted" from "known zero
  // divergences" in telemetry.
  const divergenceCount = divergencesContext?.enabled
    ? divergencesContext.state.divergences.length
    : null

  const logInspectedDivergence = useEffectEvent(() =>
    telemetry.log(InspectedDivergence, {sessionId, divergenceCount}),
  )
  useEffect(logInspectedDivergence, [logInspectedDivergence])

  const [upstreamId, upstreamRevisionId] = sinceRevisionId.split('@')

  // Both observables are memoized so their identity is stable across renders. `getDocumentAtRevision`
  // and `editState` replay synchronously from shared caches; from react-rx v7 an observable rebuilt
  // on every render is torn down and re-subscribed each render, and a synchronous replay that differs
  // from the `initialValue` would force a re-render on every commit — looping until React aborts.
  // (The React Compiler usually memoizes these expressions already; the explicit `useMemo` keeps the
  // guarantee even where the compiler bails.)
  const readUpstreamBase: Observable<HydratedSnapshot> = useMemo(
    () =>
      getDocumentAtRevision({
        client,
        documentId: upstreamId,
        revisionId: upstreamRevisionId,
      }).pipe(
        switchMap((state) => {
          if (state?.loading) {
            return of({
              isLoading: true,
            })
          }
          return of(state).pipe(
            filter((revision) => revision !== null),
            map(({document}) => document),
            switchMap((document) => {
              if (!document) {
                return EMPTY
              }

              return of(get(document, path)).pipe(
                map((value) => ({value, document})),
                startWith(undefined),
              )
            }),
            map((value) => ({isLoading: false, value})),
          )
        }),
      ),
    [client, upstreamId, upstreamRevisionId, path],
  )

  // No `getTargetScopeId(useTargetDocumentState())` here: the version is derived from the divergence's own
  // document id, independent of the selected perspective.
  const readUpstreamHead: Observable<HydratedSnapshot> = useMemo(
    () =>
      documentStore.pair
        .editState(getPublishedId(documentId), documentType, getVersionFromId(documentId))
        .pipe(
          switchMap((state) => {
            if (!state.ready) {
              return of({
                isLoading: true,
              })
            }

            return of(state).pipe(
              map(selectUpstreamVersion),
              find((document) => document !== null),
              switchMap((document) => {
                if (typeof document === 'undefined') {
                  return EMPTY
                }

                return of(get(document, path)).pipe(
                  map((value) => ({value, document})),
                  startWith(undefined),
                )
              }),
              map((value) => ({isLoading: false, value})),
            )
          }),
        ),
    [documentStore.pair, documentId, documentType, path],
  )

  // Kept synchronous: `markResolved` / `takeUpstreamValue` build and execute
  // patches from `upstreamHead.value.document` (and gate on `isLoading`), so a
  // deferred snapshot could act against a stale upstream document head.
  const upstreamBase = useSyncObservable(readUpstreamBase, LOADING_SNAPSHOT)
  const upstreamHead = useSyncObservable(readUpstreamHead, LOADING_SNAPSHOT)

  const isLoading = upstreamBase.isLoading || upstreamHead.isLoading
  const isReadOnly = contextReadOnly || isLoading || isActionPending

  // No `getTargetScopeId(useTargetDocumentState())` here: the version is derived from the divergence's subject
  // id, independent of the selected perspective.
  const {patch} = useDocumentOperation(
    getPublishedId(subjectId),
    documentType,
    getVersionFromId(subjectId),
  )

  const markResolved = async () => {
    if (isReadOnly || upstreamHead.isLoading || typeof upstreamHead.value === 'undefined') {
      return
    }

    setIsActionPending(true)

    telemetry.log(ActedOnDivergence, {
      action: 'mark-resolved',
      sessionId,
      divergenceCount,
    })

    const markers = await firstValueFrom(
      createResolutionMarkers(upstreamHead.value.document, divergence).pipe(toArray()),
    )

    const patches = createUpsertResolutionMarkerPatches(...markers)
    patch.execute(patches.map(SanityEncoder.encodePatch))
  }

  const takeUpstreamValue = async () => {
    if (isReadOnly || upstreamHead.isLoading || typeof upstreamHead.value === 'undefined') {
      return
    }

    setIsActionPending(true)

    telemetry.log(ActedOnDivergence, {
      action: 'take-upstream-value',
      sessionId,
      divergenceCount,
    })

    const patches = await firstValueFrom(
      createTakeFromUpstreamPatches(
        upstreamHead.value.document,
        allDivergences,
        ...divergence.divergences.map(([divergencePath]) => fromString(divergencePath)),
      ).pipe(toArray()),
    )

    patch.execute(patches.map(SanityEncoder.encodePatch))
  }

  return {
    upstreamBase,
    upstreamHead,
    markResolved,
    takeUpstreamValue,
    isLoading,
    isReadOnly,
    isActionPending,
  }
}

function createResolutionMarkers(
  document: SanityDocument,
  reachableDivergence: ReachableDivergence,
): Observable<ResolutionMarkerAtPath> {
  return from(reachableDivergence.divergences).pipe(
    mergeMap(([path, divergence]) => zip(of(get(document, path)), of(divergence))),
    mergeMap(([value, divergence]) => {
      if (divergence.effect === 'move') {
        throw new Error('Resolution of "move" divergences not implemented')
      }

      if (typeof value === 'undefined') {
        throw new Error(`Could not resolve upstream value at \`${divergence.path}\``)
      }

      return zip(
        of(divergence.path),
        zip(of(createDocumentRevisionMarker(document._id, document._rev)), from(hashData(value))),
      )
    }),
  )
}
