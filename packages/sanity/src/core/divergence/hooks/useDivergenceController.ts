import {SanityEncoder} from '@sanity/mutate'
import {useTelemetry} from '@sanity/telemetry/react'
import {type SanityDocument} from '@sanity/types'
import {fromString, get} from '@sanity/util/paths'
import {useContext, useEffect, useEffectEvent, useState} from 'react'
import {useObservable} from 'react-rx'
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
import {DiffViewSessionContext, DocumentDivergencesContext} from 'sanity/_singletons'

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
  const [isActionPending, setIsActionPending] = useState(false)

  const sessionId = useContext(DiffViewSessionContext)
  // Read the context directly; `useDocumentDivergences` throws outside a
  // `DivergencesProvider`, and the controller can render in trees that lack one.
  const divergencesContext = useContext(DocumentDivergencesContext)
  const divergenceCount = divergencesContext?.enabled
    ? divergencesContext.state.divergences.length
    : 0

  const logInspectedDivergence = useEffectEvent(() =>
    telemetry.log(InspectedDivergence, {sessionId, divergenceCount}),
  )
  useEffect(logInspectedDivergence, [logInspectedDivergence])

  const [upstreamId, upstreamRevisionId] = sinceRevisionId.split('@')

  const readUpstreamBase: Observable<HydratedSnapshot> = getDocumentAtRevision({
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
  )

  const readUpstreamHead: Observable<HydratedSnapshot> = documentStore.pair
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
    )

  const upstreamBase = useObservable(readUpstreamBase, {isLoading: true})
  const upstreamHead = useObservable(readUpstreamHead, {isLoading: true})

  const isLoading = upstreamBase.isLoading || upstreamHead.isLoading
  const isReadOnly = contextReadOnly || isLoading || isActionPending

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

    try {
      const markers = await firstValueFrom(
        createResolutionMarkers(upstreamHead.value.document, divergence).pipe(toArray()),
      )

      const patches = createUpsertResolutionMarkerPatches(...markers)
      patch.execute(patches.map(SanityEncoder.encodePatch))

      telemetry.log(ActedOnDivergence, {
        action: 'mark-resolved',
        sessionId,
        divergenceCount,
        status: 'success',
      })
      setIsActionPending(false)
    } catch (error) {
      telemetry.log(ActedOnDivergence, {
        action: 'mark-resolved',
        sessionId,
        divergenceCount,
        status: 'failure',
      })
      setIsActionPending(false)
      throw error
    }
  }

  const takeUpstreamValue = async () => {
    if (isReadOnly || upstreamHead.isLoading || typeof upstreamHead.value === 'undefined') {
      return
    }

    setIsActionPending(true)

    try {
      const patches = await firstValueFrom(
        createTakeFromUpstreamPatches(
          upstreamHead.value.document,
          allDivergences,
          ...divergence.divergences.map(([divergencePath]) => fromString(divergencePath)),
        ).pipe(toArray()),
      )

      patch.execute(patches.map(SanityEncoder.encodePatch))

      telemetry.log(ActedOnDivergence, {
        action: 'take-upstream-value',
        sessionId,
        divergenceCount,
        status: 'success',
      })
      setIsActionPending(false)
    } catch (error) {
      telemetry.log(ActedOnDivergence, {
        action: 'take-upstream-value',
        sessionId,
        divergenceCount,
        status: 'failure',
      })
      setIsActionPending(false)
      throw error
    }
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
