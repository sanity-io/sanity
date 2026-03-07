import {type SanityClient} from '@sanity/client'
import {type ObjectSchemaType, type SanityDocument} from '@sanity/types'
import get from 'lodash-es/get.js'
import {type ComponentType, type PropsWithChildren, useContext, useEffect, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {BehaviorSubject, combineLatest, EMPTY, filter, map, of, Subject, tap} from 'rxjs'
import {type DocumentDivergencesContextValue, DocumentDivergencesContext} from 'sanity/_singletons'

import {
  collateDocumentDivergences,
  collateDocumentDivergencesInitialState,
} from '../../divergence/collateDocumentDivergences'
import {useDivergenceNavigator} from '../../divergence/divergenceNavigator'
import {
  isDivergenceResolutions,
  type DivergenceResolution,
  type FindDivergencesContext,
} from '../../divergence/readDocumentDivergences'
import {readMostRecentSharedTransaction} from '../../divergence/readMostRecentSharedTransaction'
import {type ResolutionMarker} from '../../divergence/types/ResolutionMarker'
import {useClient} from '../../hooks/useClient'
import {type EditStateFor} from '../../store'
import {selectUpstreamVersion} from '../../store/_legacy/document/selectUpstreamVersion'
import {getDocumentAtRevision} from '../../store/events/getDocumentAtRevision'
import {useWorkspace} from '../../studio/workspace'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../studioClient'
import {isPublishedId} from '../../util/draftUtils'
import {type FormState} from '../store'

interface Props extends PropsWithChildren {
  formState: FormState
  upstreamEditState: EditStateFor
  editState: EditStateFor
  subjectId: string
  displayedId: string
  schemaType: ObjectSchemaType
}

/**
 * @internal
 */
export const DivergencesProvider: ComponentType<Props> = ({
  formState,
  upstreamEditState,
  editState,
  subjectId,
  schemaType,
  displayedId,
  children,
}) => {
  const {
    advancedVersionControl: {enabled: advancedVersionControlEnabled},
  } = useWorkspace()

  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  const upstreamHead = selectUpstreamVersion(upstreamEditState)
  const upstreamId = upstreamHead?._id
  const hasUpstreamVersion = typeof upstreamId !== 'undefined'

  const subject = isPublishedId(displayedId)
    ? editState.published
    : (editState.version ?? editState.draft)

  const collatedDivergences =
    !advancedVersionControlEnabled ||
    !hasUpstreamVersion ||
    typeof upstreamId === 'undefined' ||
    typeof subjectId === 'undefined'
      ? {
          context: new Subject<FindDivergencesContext>(),
          observable: of(collateDocumentDivergencesInitialState),
        }
      : collateDocumentDivergences({
          subjectId: subjectId,
          upstreamId: upstreamId,
        })

  useCollateDivergencesContext({
    upstreamHead,
    hasUpstreamVersion,
    subjectHead: subject,
    resolutions:
      subject &&
      '_systemDivergences' in subject &&
      typeof subject._systemDivergences === 'object' &&
      subject._systemDivergences !== null &&
      'resolutions' in subject._systemDivergences &&
      isDivergenceResolutions(subject._systemDivergences.resolutions)
        ? subject._systemDivergences.resolutions
        : [],
    client,
    context: collatedDivergences.context,
  })

  const divergenceNavigator = useDivergenceNavigator({
    divergences: collatedDivergences.observable,
    schemaType,
    formState,
  })

  return (
    <DocumentDivergencesContext.Provider value={divergenceNavigator}>
      {children}
    </DocumentDivergencesContext.Provider>
  )
}

/**
 * @internal
 */
export function useDocumentDivergences(): DocumentDivergencesContextValue {
  const context = useContext(DocumentDivergencesContext)

  if (!context) {
    throw new Error('useDocumentDivergences must be used within a DocumentDivergencesContext')
  }

  return context
}

/**
 * Listen to the dependencies required to collate divergences, and update its
 * context when they change.
 */
function useCollateDivergencesContext({
  upstreamHead,
  hasUpstreamVersion,
  subjectHead,
  resolutions,
  client,
  context,
}: {
  upstreamHead: SanityDocument | null
  hasUpstreamVersion: boolean
  subjectHead: SanityDocument | null
  resolutions: {
    _key: string
    resolutionMarker: ResolutionMarker
  }[]
  client: SanityClient
  context: Subject<FindDivergencesContext>
}):
  | {
      upstreamHead: SanityDocument
      subjectHead: SanityDocument
      resolutions: DivergenceResolution[]
      upstreamAtFork: SanityDocument
    }
  | undefined {
  const shouldFindForkPoint = hasUpstreamVersion && subjectHead && upstreamHead
  const baseIsForkPoint = get(subjectHead, ['_system', 'base', 'id']) === upstreamHead?._id

  const mostRecentSharedTransaction = useObservable(
    shouldFindForkPoint && baseIsForkPoint
      ? EMPTY
      : readMostRecentSharedTransaction({
          a: upstreamHead?._id,
          b: subjectHead?._id,
          client,
        }),
  )

  const listenUpstreamHead = useMemo(() => new BehaviorSubject<SanityDocument | null>(null), [])
  useEffect(() => listenUpstreamHead.next(upstreamHead), [upstreamHead, listenUpstreamHead])

  const listenSubjectHead = useMemo(() => new BehaviorSubject<SanityDocument | null>(null), [])
  useEffect(() => listenSubjectHead.next(subjectHead), [subjectHead, listenSubjectHead])

  const listenResolutions = useMemo(
    () => new BehaviorSubject<DivergenceResolution[] | null>(null),
    [],
  )

  useEffect(() => listenResolutions.next(resolutions ?? []), [resolutions, listenResolutions])

  // Read the base upstream document.
  //
  // - If the subject version's `_system.base.id` points to its current
  //   upstream, the target of the subject's `_system.base` is inferred to be
  //   the base upstream document.
  // - Otherwise, the base upstream document is identified using the most recent
  //   transaction shared by the subject and upstream versions.
  const readUpstreamAtFork = useMemo(() => {
    if (shouldFindForkPoint && baseIsForkPoint) {
      return getDocumentAtRevision({
        client,
        documentId: get(subjectHead, ['_system', 'base', 'id']),
        revisionId: get(subjectHead, ['_system', 'base', 'rev']),
      })
    }

    if (
      upstreamHead === null ||
      subjectHead === null ||
      !hasUpstreamVersion ||
      typeof mostRecentSharedTransaction === 'undefined'
    ) {
      return EMPTY
    }

    return getDocumentAtRevision({
      client,
      documentId: mostRecentSharedTransaction.documentIDs[0],
      revisionId: mostRecentSharedTransaction.id,
    })
  }, [
    upstreamHead,
    subjectHead,
    hasUpstreamVersion,
    mostRecentSharedTransaction,
    client,
    shouldFindForkPoint,
    baseIsForkPoint,
  ])

  const listenContext = useMemo(() => {
    return combineLatest({
      upstreamHead: listenUpstreamHead.pipe(
        filter((document) => typeof document !== 'undefined' && document !== null),
      ),
      subjectHead: listenSubjectHead.pipe(
        filter((document) => typeof document !== 'undefined' && document !== null),
      ),
      resolutions: listenResolutions.pipe(map((nextResolutions) => nextResolutions ?? [])),
      upstreamAtFork: readUpstreamAtFork.pipe(
        filter((revision) => revision !== null),
        map(({document}) => document),
        filter((document) => typeof document !== 'undefined' && document !== null),
      ),
    }).pipe(tap((nextContext) => context.next(nextContext)))
  }, [readUpstreamAtFork, context, listenUpstreamHead, listenSubjectHead, listenResolutions])

  return useObservable(listenContext)
}
