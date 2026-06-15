import {type ReleaseDocument} from '@sanity/client'
import {getVersionFromId, isPublishedId} from '@sanity/client/csm'
import {type DocumentSystem} from '@sanity/types'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {catchError, finalize, map, type Observable, of, shareReplay} from 'rxjs'

import {useDataset} from '../../hooks/useDataset'
import {useProjectId} from '../../hooks/useProjectId'
import {DOCUMENT_SYSTEM_FIELD} from '../../preview/constants'
import {type DocumentPreviewStore} from '../../preview/documentPreviewStore'
import {type DocumentSetObserverState} from '../../preview/liveDocumentSet'
import {useDocumentPreviewStore} from '../../store'
import {getPublishedId} from '../../util/draftUtils'
import {createSWR} from '../../util/rxSwr'
import {type VersionInfoDocumentStub} from '../store/types'
import {useActiveReleases} from '../store/useActiveReleases'
import {getReleaseIdFromReleaseDocumentId} from '../util/getReleaseIdFromReleaseDocumentId'
import {RELEASES_STUDIO_CLIENT_OPTIONS} from '../util/releasesClient'

export interface DocumentPerspectiveProps {
  documentId: string
}

export interface DocumentPerspectiveState {
  data: string[]
  versions: VersionInfoDocumentStub[]
  error?: unknown
  loading: boolean
}

const INITIAL_VALUE: DocumentPerspectiveState = {
  data: [],
  versions: [],
  error: null,
  loading: true,
}

// Create a singleton cache for observables
export const observableCache = new Map<string, Observable<DocumentPerspectiveState>>()
const swr = createSWR<DocumentSetObserverState<VersionInfoDocumentStub>>({maxSize: 100})

/**
 * Fetches the document versions for a given document
 * @param props - document Id of the document (might include release id)
 * @returns - data: document versions, loading, errors
 * @hidden
 * @beta
 */
export function useDocumentVersions(props: DocumentPerspectiveProps): DocumentPerspectiveState {
  const {documentId} = props
  const publishedId = getPublishedId(documentId)

  const dataset = useDataset()
  const projectId = useProjectId()
  const documentPreviewStore = useDocumentPreviewStore()
  const {data: releases} = useActiveReleases()

  const observable: Observable<DocumentPerspectiveState> = useMemo(() => {
    return getOrCreateDocumentVersionsObservable({
      documentPreviewStore,
      publishedId,
      projectId,
      dataset,
    })
  }, [dataset, documentPreviewStore, projectId, publishedId])
  const result = useObservable(observable, INITIAL_VALUE)

  const versions = result.versions.map((version) => {
    return {
      ...version,
      [DOCUMENT_SYSTEM_FIELD]: version._system?.group
        ? version._system
        : {
            ...version._system,
            ...temporarilyBuildDocumentSystem(version._id, releases),
          },
    }
  })
  return {
    ...result,
    versions,
  }
}

/**
 * Temporarily builds the document _system for a given document id.
 * This is used until the documents are migrated to the new _system.
 * And only if the documents are not variant documents.
 *
 * Variants will include the _system field.
 */
const temporarilyBuildDocumentSystem = (
  id: string,
  releases: ReleaseDocument[],
): DocumentSystem => {
  const versionId = getVersionFromId(id)
  if (versionId) {
    const releaseDocument = releases.find(
      (release) => getReleaseIdFromReleaseDocumentId(release._id) === versionId,
    )
    return {
      bundleId: versionId,
      release: releaseDocument ? {_ref: releaseDocument._id, _weak: true} : null,
      variant: null,
      group: {
        _ref: getPublishedId(id),
        _weak: true,
      },
      scopeId: versionId,
    }
  }

  return {
    bundleId: isPublishedId(id) ? '$published' : 'drafts',
    release: null,
    variant: null,
    group: {_ref: getPublishedId(id), _weak: true},
    scopeId: versionId || null,
  }
}

const DOCUMENT_STUB_PATHS = ['_id', '_type', '_rev', '_createdAt', '_updatedAt', '_system']

/**
 * Retrieves an observable that emits the document versions that exist for a specific id.
 *
 * The versions (and the fields needed to build each version stub) are resolved in a single
 * query via {@link DocumentPreviewStore.unstable_observeDocumentSet} and kept in sync in
 * real time, rather than first resolving the set of ids and then fetching each version's
 * fields separately.
 *
 * @param options - The options for creating or retrieving the observable.
 * options.documentPreviewStore - The store used to observe the document set.
 * options.publishedId - The ID of the published document.
 * options.projectId - The project ID.
 * options.dataset - The dataset name.
 * @returns An observable that emits the document versions.
 *
 * @hidden
 * @internal
 */
export function getOrCreateDocumentVersionsObservable(options: {
  documentPreviewStore: DocumentPreviewStore
  publishedId: string
  projectId: string
  dataset: string
}): Observable<DocumentPerspectiveState> {
  const {documentPreviewStore, projectId, dataset, publishedId} = options
  const cacheKey = `${projectId}-${dataset}-${publishedId}`

  const cachedObservable = observableCache.get(cacheKey)
  if (cachedObservable) {
    return cachedObservable
  }

  const newObservable = documentPreviewStore
    .unstable_observeDocumentSet<VersionInfoDocumentStub>(
      `sanity::versionOf("${publishedId}")`,
      DOCUMENT_STUB_PATHS,
      {apiVersion: RELEASES_STUDIO_CLIENT_OPTIONS.apiVersion},
    )
    .pipe(
      swr(cacheKey),
      map(({value}): DocumentPerspectiveState => {
        const {documents} = value
        return {
          data: documents.map((doc) => doc._id),
          versions: documents.map(
            (doc) =>
              ({
                _id: doc._id,
                _rev: doc._rev ?? '',
                _createdAt: doc._createdAt ?? '',
                _updatedAt: doc._updatedAt ?? '',
                [DOCUMENT_SYSTEM_FIELD]: doc._system,
              }) satisfies VersionInfoDocumentStub,
          ),
          error: null,
          loading: false,
        }
      }),
      catchError((error) => {
        return of({
          error,
          data: [] as string[],
          versions: [] as VersionInfoDocumentStub[],
          loading: false,
        })
      }),
      finalize(() => {
        observableCache.delete(cacheKey)
      }),
      shareReplay({refCount: true, bufferSize: 1}),
    )

  observableCache.set(cacheKey, newObservable)
  return newObservable
}
