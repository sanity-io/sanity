import {
  type CurrentUser,
  isValidationErrorMarker,
  type SanityDocument,
  type Schema,
} from '@sanity/types'
import {uuid} from '@sanity/uuid'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {combineLatest, from, type Observable, of} from 'rxjs'
import {mergeMapArray} from 'rxjs-mergemap-array'
import {catchError, delay, filter, finalize, map, shareReplay, switchMap} from 'rxjs/operators'

import {useSchema} from '../../../hooks'
import {type LocaleSource} from '../../../i18n/types'
import {type DocumentPreviewStore} from '../../../preview'
import {useDocumentPreviewStore} from '../../../store/datastores'
import {useSource} from '../../../studio'
import {schedulerYield} from '../../../util/schedulerYield'
import {validateDocumentWithReferences, type ValidationStatus} from '../../../validation'
import {RELEASES_STUDIO_CLIENT_OPTIONS} from '../../util/releasesClient'

const bundleDocumentsCache: Record<string, BundleDocumentsObservableResult> = Object.create(null)

export interface DocumentValidationStatus extends ValidationStatus {
  hasError: boolean
}

export interface DocumentInRelease {
  memoKey: string
  isPending?: boolean
  document: SanityDocument & {publishedDocumentExists: boolean; draftDocumentExists?: boolean}
  validation: DocumentValidationStatus
}

export type BundleDocumentsObservableResult = Observable<{
  loading: boolean
  results: DocumentInRelease[]
  error: Error | null
}>

interface BundleDocumentsObservableOptions {
  schema: Schema
  documentPreviewStore: DocumentPreviewStore
  i18n: LocaleSource
  getClient: ReturnType<typeof useSource>['getClient']
  currentUser?: Omit<CurrentUser, 'role'> | null
  /**
   * The GROQ filter used to resolve the set of documents to fetch,
   * e.g. `sanity::partOfRelease($releaseId)` or `sanity::partOfVariant($variantId)`.
   */
  groqFilter: string
  /**
   * The params referenced by `groqFilter`, e.g. `{releaseId}` or `{variantId}`.
   */
  params: Record<string, unknown>
  /**
   * Returns `true` for documents that should not be validated (validation is short-circuited).
   * Used, for example, to skip documents that are going to be unpublished in a release.
   */
  skipValidation?: (document: SanityDocument) => boolean
}

const buildBundleDocumentsObservable = ({
  schema,
  documentPreviewStore,
  i18n,
  getClient,
  currentUser,
  groqFilter,
  params,
  skipValidation,
}: Omit<BundleDocumentsObservableOptions, 'cacheKey'>): BundleDocumentsObservableResult => {
  // Helper function to create validation observable
  const createValidationObservable = (ctx: any, document: SanityDocument) => {
    if (skipValidation?.(document)) {
      return of({
        isValidating: false,
        validation: [],
        revision: document._rev,
        hasError: false,
      } satisfies DocumentValidationStatus)
    }

    // scheduledYield is used to provide some control over the main thread
    return from(schedulerYield(() => Promise.resolve())).pipe(
      switchMap(() =>
        validateDocumentWithReferences(ctx, of(document), false).pipe(
          map((validationStatus) => ({
            ...validationStatus,
            hasError: validationStatus.validation.some((marker) => isValidationErrorMarker(marker)),
          })),
        ),
      ),
    )
  }

  // Helper function to process a single document and set up the associated validation observable
  const processDocument = (id: string) => {
    const ctx = {
      observeDocument: documentPreviewStore.unstable_observeDocument,
      observeDocumentPairAvailability:
        documentPreviewStore.unstable_observeDocumentPairAvailability,
      i18n,
      getClient,
      schema,
      currentUser,
    }

    const document$ = documentPreviewStore
      .unstable_observeDocument(id, {
        apiVersion: RELEASES_STUDIO_CLIENT_OPTIONS.apiVersion,
      })
      .pipe(
        filter(Boolean),
        switchMap((doc) => {
          return documentPreviewStore.unstable_observeDocumentPairAvailability(id).pipe(
            map((availability) => ({
              ...doc,
              publishedDocumentExists: availability.published.available,
              draftDocumentExists: availability.draft.available,
            })),
          )
        }),
      )

    const validation$ = document$.pipe(
      switchMap((document) => createValidationObservable(ctx, document)),
    )

    return combineLatest([document$, validation$]).pipe(
      map(([document, validation]) => ({
        document,
        validation,
        memoKey: uuid(),
      })),
    )
  }

  // Helper function to process a group of document Ids
  // Used to process documents as to not overwhelm the main thread
  const processDocumentIdsGroup = (documentIdsGroup: string[], groupIndex: number) => {
    // On the first batch there is no delay
    const batchDelay = groupIndex === 0 ? 0 : 100

    return of(documentIdsGroup).pipe(
      delay(batchDelay),
      mergeMapArray((id: string) => processDocument(id)),
    )
  }

  return documentPreviewStore
    .unstable_observeDocumentIdSet(groqFilter, params, {
      apiVersion: RELEASES_STUDIO_CLIENT_OPTIONS.apiVersion,
    })
    .pipe(
      map((state) => state.documentIds || []),
      switchMap((documentIds) => {
        // If no documents, return empty results immediately
        if (documentIds.length === 0) {
          return of([])
        }

        // Process in smaller groups as to not overwhelm the main thread
        // depending on the browser it can handle a different number of calls at once, this felt like a good balance
        // given the tests done
        const batchSize = 5
        const documentIdsGroups = []
        for (let i = 0; i < documentIds.length; i += batchSize) {
          documentIdsGroups.push(documentIds.slice(i, i + batchSize))
        }

        // Process all batches and collect all results
        return combineLatest(
          documentIdsGroups.map((batch, batchIndex) =>
            // The delay is used to control the rate of the requests
            // It increases as it goes on as to allow for some space (in the miliseconds scale)
            // This means that technically one might expect it to take longer to get all the results, but
            // It makes the user experience better as it is not overwhelming the main thread
            // And it allows for the browser to more easily handle the requests
            processDocumentIdsGroup(batch, batchIndex).pipe(delay(batchIndex * 100)),
          ),
        ).pipe(
          // Flatten all batch results into a single array
          // This is done to avoid having to nest the results and keep the strutcture as it was before
          map((groupResults) => groupResults.flat()),
        )
      }),
      map((results) => ({loading: false, results, error: null})),
      catchError((error) => {
        return of({loading: false, results: [], error})
      }),
    )
}

/**
 * Generic document-fetching machinery shared across releases and variants.
 *
 * Resolves the set of documents matching `groqFilter`/`params`, then observes each document along
 * with its published availability and validation status. Results are batched to avoid overwhelming
 * the main thread, and shared across subscribers via a module-level cache keyed by `cacheKey`.
 *
 * @internal
 */
export const getBundleDocumentsObservable = ({
  cacheKey,
  ...options
}: BundleDocumentsObservableOptions & {cacheKey: string}): BundleDocumentsObservableResult => {
  if (!bundleDocumentsCache[cacheKey]) {
    bundleDocumentsCache[cacheKey] = buildBundleDocumentsObservable(options).pipe(
      finalize(() => {
        delete bundleDocumentsCache[cacheKey]
      }),
      shareReplay(1),
    )
  }

  return bundleDocumentsCache[cacheKey]
}

const BUNDLE_DOCUMENTS_INITIAL_STATE = {
  loading: true,
  results: [],
  error: null,
}

/**
 * Generic hook to fetch the documents matching a GROQ filter, along with their validation and
 * published availability. Used by release- and variant-specific hooks.
 *
 * @internal
 */
export function useBundleDocuments(options: {
  groqFilter: string
  params: Record<string, unknown>
  cacheKey: string
  skipValidation?: (document: SanityDocument) => boolean
}): {
  loading: boolean
  results: DocumentInRelease[]
  error: null | Error
} {
  const {groqFilter, params, cacheKey, skipValidation} = options
  const documentPreviewStore = useDocumentPreviewStore()
  const {getClient, i18n, currentUser} = useSource()
  const schema = useSchema()

  const bundleDocumentsObservable = useMemo(
    () =>
      getBundleDocumentsObservable({
        schema,
        documentPreviewStore,
        getClient,
        i18n,
        currentUser,
        groqFilter,
        params,
        cacheKey,
        skipValidation,
      }),
    [
      schema,
      documentPreviewStore,
      getClient,
      i18n,
      currentUser,
      groqFilter,
      params,
      cacheKey,
      skipValidation,
    ],
  )

  return useObservable(bundleDocumentsObservable, BUNDLE_DOCUMENTS_INITIAL_STATE)
}
