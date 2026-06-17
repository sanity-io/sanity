import {type ReleaseDocument} from '@sanity/client'
import {type CurrentUser, type SanityDocument, type Schema} from '@sanity/types'
import {uuid} from '@sanity/uuid'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {combineLatest, type Observable, of} from 'rxjs'
import {
  catchError,
  distinctUntilChanged,
  expand,
  filter,
  finalize,
  map,
  reduce,
  shareReplay,
  startWith,
  switchMap,
} from 'rxjs/operators'

import {useSchema} from '../../../hooks'
import {type LocaleSource} from '../../../i18n/types'
import {type DocumentPreviewStore} from '../../../preview'
import {useDocumentPreviewStore} from '../../../store/datastores'
import {useSource} from '../../../studio'
import {useReleasesStore} from '../../store/useReleasesStore'
import {getReleaseDocumentIdFromReleaseId} from '../../util/getReleaseDocumentIdFromReleaseId'
import {RELEASES_STUDIO_CLIENT_OPTIONS} from '../../util/releasesClient'
import {
  type BundleDocumentsResult,
  type DocumentInBundle,
  getBundleDocumentsObservable,
} from './useBundleDocuments'

type ReleaseDocumentsObservableResult = Observable<BundleDocumentsResult<DocumentInBundle>>

const releaseDocumentsCache: Record<string, ReleaseDocumentsObservableResult> = Object.create(null)

const getActiveReleaseDocumentsObservable = ({
  schema,
  documentPreviewStore,
  i18n,
  getClient,
  releaseId,
  currentUser,
}: {
  schema: Schema
  documentPreviewStore: DocumentPreviewStore
  i18n: LocaleSource
  getClient: ReturnType<typeof useSource>['getClient']
  releaseId: string
  currentUser?: Omit<CurrentUser, 'role'> | null
}): ReleaseDocumentsObservableResult =>
  getBundleDocumentsObservable<DocumentInBundle>({
    schema,
    documentPreviewStore,
    i18n,
    getClient,
    currentUser,
    groqFilter: `sanity::partOfRelease($releaseId)`,
    queryParams: {releaseId},
    clientOptions: RELEASES_STUDIO_CLIENT_OPTIONS,
    // Releases additionally resolve whether a published version of the document exists.
    observeDocument: (id: string) =>
      documentPreviewStore
        .unstable_observeDocument(id, {apiVersion: RELEASES_STUDIO_CLIENT_OPTIONS.apiVersion})
        .pipe(
          filter(Boolean),
          switchMap((doc) =>
            documentPreviewStore.unstable_observeDocumentPairAvailability(id).pipe(
              map((availability) => ({
                ...doc,
                publishedDocumentExists: availability.published.available,
              })),
            ),
          ),
        ),
    mapDocument: (document, validation) => ({
      document: document as DocumentInBundle['document'],
      validation,
      memoKey: uuid(),
    }),
  })

const getPublishedArchivedReleaseDocumentsObservable = ({
  getClient,
  release,
}: {
  getClient: ReturnType<typeof useSource>['getClient']
  release: ReleaseDocument
}): ReleaseDocumentsObservableResult => {
  const client = getClient(RELEASES_STUDIO_CLIENT_OPTIONS)
  const observableClient = client.observable
  const dataset = client.config().dataset

  if (!release.finalDocumentStates?.length) return of({loading: false, results: [], error: null})

  function batchRequestDocumentFromHistory(startIndex: number) {
    const finalIndex = startIndex + 10
    return observableClient
      .request<{documents: DocumentInBundle['document'][]}>({
        url: `/data/history/${dataset}/documents/${release.finalDocumentStates
          ?.slice(startIndex, finalIndex)
          .map((d) => d.id)
          .join(',')}?lastRevision=true`,
      })
      .pipe(map(({documents}) => ({documents, finalIndex})))
  }

  const documents$ = batchRequestDocumentFromHistory(0).pipe(
    expand((response) => {
      if (release.finalDocumentStates && response.finalIndex < release.finalDocumentStates.length) {
        // Continue with next batch
        return batchRequestDocumentFromHistory(response.finalIndex)
      }
      // End recursion by emitting an empty observable
      return of()
    }),
    reduce(
      (documents: DocumentInBundle['document'][], batch) => documents.concat(batch.documents),
      [],
    ),
  )

  return documents$.pipe(
    map((documents) => ({
      loading: false,
      results: documents.map((document) => ({
        document,
        memoKey: uuid(),
        validation: {validation: [], hasError: false, isValidating: false},
      })),
      error: null,
    })),
    catchError((error) => {
      return of({loading: false, results: [], error})
    }),
  )
}

const getReleaseDocumentsObservable = ({
  schema,
  documentPreviewStore,
  getClient,
  releaseId,
  i18n,
  releasesState$,
  currentUser,
}: {
  schema: Schema
  documentPreviewStore: DocumentPreviewStore
  getClient: ReturnType<typeof useSource>['getClient']
  releaseId: string
  i18n: LocaleSource
  releasesState$: ReturnType<typeof useReleasesStore>['state$']
  currentUser?: Omit<CurrentUser, 'role'> | null
}): ReleaseDocumentsObservableResult => {
  if (!releaseDocumentsCache[releaseId]) {
    releaseDocumentsCache[releaseId] = releasesState$.pipe(
      map((releasesState) =>
        releasesState.releases.get(getReleaseDocumentIdFromReleaseId(releaseId)),
      ),
      filter(Boolean), // Removes falsey values
      distinctUntilChanged((prev, next) => {
        // Only skip re-validation if the core fields that affect document validation haven't changed
        // Return true to skip, false to trigger re-validation
        // _rev wasn't enough since it changed on every edit of the release document itself
        return prev.state === next.state && prev.finalDocumentStates === next.finalDocumentStates
      }),
      switchMap((release) => {
        // Create cache key based on fields that affect document validation + _rev
        const cacheKey = [
          releaseId,
          release.state,
          release.finalDocumentStates?.flatMap((doc) => doc.id),
          release._rev,
        ].join('-')

        if (!releaseDocumentsCache[cacheKey]) {
          let observable: ReleaseDocumentsObservableResult

          if (release.state === 'published' || release.state === 'archived') {
            observable = getPublishedArchivedReleaseDocumentsObservable({
              getClient,
              release,
            })
          } else {
            observable = getActiveReleaseDocumentsObservable({
              schema,
              documentPreviewStore,
              i18n,
              getClient,
              releaseId,
              currentUser,
            })
          }

          releaseDocumentsCache[cacheKey] = observable.pipe(
            finalize(() => {
              delete releaseDocumentsCache[cacheKey]
            }),
            shareReplay(1),
          )
        }

        return releaseDocumentsCache[cacheKey]
      }),
      startWith({loading: true, results: [], error: null}),
      shareReplay(1),
    )
  }

  return releaseDocumentsCache[releaseId]
}

export function useReleaseDocuments(releaseId: string): {
  loading: boolean
  results: DocumentInBundle[]
  error: null | Error
} {
  const documentPreviewStore = useDocumentPreviewStore()
  const {getClient, i18n, currentUser} = useSource()
  const schema = useSchema()
  const {state$: releasesState$} = useReleasesStore()

  const releaseDocumentsObservable = useMemo(
    () =>
      getReleaseDocumentsObservable({
        schema,
        documentPreviewStore,
        getClient,
        releaseId,
        i18n,
        releasesState$,
        currentUser,
      }),
    [schema, documentPreviewStore, getClient, releaseId, i18n, releasesState$, currentUser],
  )

  return useObservable(releaseDocumentsObservable, {
    loading: true,
    results: [],
    error: null,
  })
}
