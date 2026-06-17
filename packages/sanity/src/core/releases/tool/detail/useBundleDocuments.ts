import {
  type CurrentUser,
  isValidationErrorMarker,
  type SanityDocument,
  type Schema,
} from '@sanity/types'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {combineLatest, from, type Observable, of} from 'rxjs'
import {mergeMapArray} from 'rxjs-mergemap-array'
import {
  catchError,
  delay,
  filter,
  finalize,
  map,
  shareReplay,
  startWith,
  switchMap,
} from 'rxjs/operators'

import {type SourceClientOptions} from '../../../config/types'
import {useSchema} from '../../../hooks'
import {type LocaleSource} from '../../../i18n/types'
import {type DocumentPreviewStore} from '../../../preview'
import {useDocumentPreviewStore} from '../../../store/datastores'
import {useSource} from '../../../studio'
import {schedulerYield} from '../../../util/schedulerYield'
import {validateDocumentWithReferences, type ValidationStatus} from '../../../validation'
import {isGoingToUnpublish} from '../../util/isGoingToUnpublish'

/**
 * Generic cache shared by every consumer of the bundle documents machinery.
 * Entries are keyed by the caller-provided `cacheKey` and removed once the last
 * subscriber unsubscribes (see `finalize` below).
 */
const bundleDocumentsCache: Record<
  string,
  Observable<BundleDocumentsResult<unknown>>
> = Object.create(null)

/** @internal */
export function resetBundleDocumentsCacheForTests(): void {
  for (const key of Object.keys(bundleDocumentsCache)) {
    delete bundleDocumentsCache[key]
  }
}

export interface DocumentValidationStatus extends ValidationStatus {
  hasError: boolean
}

export interface DocumentInBundle {
  memoKey: string
  isPending?: boolean
  document: SanityDocument & {publishedDocumentExists: boolean}
  validation: DocumentValidationStatus
}

export interface BundleDocumentsResult<TResult> {
  loading: boolean
  results: TResult[]
  error: Error | null
}

interface BundleDocumentsContext {
  schema: Schema
  documentPreviewStore: DocumentPreviewStore
  i18n: LocaleSource
  getClient: ReturnType<typeof useSource>['getClient']
  currentUser?: Omit<CurrentUser, 'role'> | null
}

interface BundleDocumentsConfig<TResult> {
  /** The groq filter used to resolve the set of documents that belong to the bundle. */
  groqFilter: string
  /** Parameters referenced by `groqFilter` (for example `{releaseId}` or `{variantId}`). */
  queryParams: Record<string, string>
  /** Client options (used for the api version of the underlying observe calls). */
  clientOptions: SourceClientOptions
  /**
   * Optional override for how a single document is observed. Defaults to a plain
   * `unstable_observeDocument` (filtering out empty results). Releases override this to
   * additionally resolve whether a published document exists.
   */
  observeDocument?: (id: string) => Observable<SanityDocument>
  /**
   * Maps an observed document + its validation into the shape returned by the hook.
   * Returning `null` drops the document from the results.
   */
  mapDocument: (document: SanityDocument, validation: DocumentValidationStatus) => TResult | null
}

type ValidationContext = Parameters<typeof validateDocumentWithReferences>[0]

// Helper to create the validation observable for a single document.
const createValidationObservable = (
  ctx: ValidationContext,
  document: SanityDocument,
): Observable<DocumentValidationStatus> => {
  if (isGoingToUnpublish(document)) {
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

/**
 * The underlying machinery that resolves a set of documents (matched by a groq filter), observes
 * each of them, validates them and batches the work as to not overwhelm the main thread.
 *
 * This is intentionally agnostic of releases/variants; callers parameterize it via `groqFilter`,
 * `queryParams`, `observeDocument` and `mapDocument`.
 *
 * @internal
 */
export function getBundleDocumentsObservable<TResult>({
  schema,
  documentPreviewStore,
  i18n,
  getClient,
  currentUser,
  groqFilter,
  queryParams,
  clientOptions,
  observeDocument,
  mapDocument,
}: BundleDocumentsContext & BundleDocumentsConfig<TResult>): Observable<
  BundleDocumentsResult<TResult>
> {
  const observe =
    observeDocument ??
    ((id: string) =>
      documentPreviewStore
        .unstable_observeDocument(id, {apiVersion: clientOptions.apiVersion})
        .pipe(filter(Boolean)))

  // Process a single document and set up the associated validation observable.
  const processDocument = (id: string): Observable<TResult | null> => {
    const ctx: ValidationContext = {
      observeDocumentPairAvailability:
        documentPreviewStore.unstable_observeDocumentPairAvailability,
      i18n,
      getClient,
      schema,
      currentUser,
    }

    const document$ = observe(id)

    const validation$ = document$.pipe(
      switchMap((document) => createValidationObservable(ctx, document)),
    )

    return combineLatest([document$, validation$]).pipe(
      map(([document, validation]) => mapDocument(document, validation)),
    )
  }

  // Process a group of document ids. Used to process documents as to not overwhelm the main thread.
  const processDocumentIdsGroup = (documentIdsGroup: string[], groupIndex: number) => {
    // On the first batch there is no delay
    const batchDelay = groupIndex === 0 ? 0 : 100

    return of(documentIdsGroup).pipe(
      delay(batchDelay),
      mergeMapArray((id: string) => processDocument(id)),
    )
  }

  return documentPreviewStore
    .unstable_observeDocumentIdSet(groqFilter, queryParams, {
      apiVersion: clientOptions.apiVersion,
    })
    .pipe(
      map((state) => state.documentIds || []),
      switchMap((documentIds) => {
        // If no documents, return empty results immediately
        if (documentIds.length === 0) {
          return of<(TResult | null)[]>([])
        }

        // Process in smaller groups as to not overwhelm the main thread
        // depending on the browser it can handle a different number of calls at once, this felt like a good balance
        // given the tests done
        const batchSize = 5
        const documentIdsGroups: string[][] = []
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
          map((groupResults) => groupResults.flat()),
        )
      }),
      map((results) => ({
        loading: false,
        results: results.filter((result): result is TResult => result !== null),
        error: null,
      })),
      catchError((error) => of({loading: false, results: [] as TResult[], error})),
    )
}

interface UseBundleDocumentsOptions<TResult> extends BundleDocumentsConfig<TResult> {
  /** Identifies the cached observable. Subscribers sharing a `cacheKey` share the same stream. */
  cacheKey: string
  /** When `false`, the hook short-circuits to an empty result without subscribing. */
  enabled?: boolean
}

// Resolves (and memoizes) the shared observable for a given `cacheKey`. Kept out of the hook body
// so that the module-level cache is never mutated directly from within a hook.
function getOrCreateBundleDocumentsObservable<TResult>(
  cacheKey: string,
  create: () => Observable<BundleDocumentsResult<TResult>>,
): Observable<BundleDocumentsResult<TResult>> {
  if (!bundleDocumentsCache[cacheKey]) {
    bundleDocumentsCache[cacheKey] = create().pipe(
      startWith({loading: true, results: [], error: null}),
      finalize(() => {
        delete bundleDocumentsCache[cacheKey]
      }),
      shareReplay(1),
    ) as Observable<BundleDocumentsResult<unknown>>
  }

  return bundleDocumentsCache[cacheKey] as Observable<BundleDocumentsResult<TResult>>
}

/**
 * Generic hook that subscribes to {@link getBundleDocumentsObservable} with a shared, ref-counted
 * cache keyed by `cacheKey`. Release-specific and variant-specific hooks build on top of this.
 *
 * @internal
 */
export function useBundleDocuments<TResult>({
  cacheKey,
  enabled = true,
  groqFilter,
  queryParams,
  clientOptions,
  observeDocument,
  mapDocument,
}: UseBundleDocumentsOptions<TResult>): BundleDocumentsResult<TResult> {
  const documentPreviewStore = useDocumentPreviewStore()
  const {getClient, i18n, currentUser} = useSource()
  const schema = useSchema()

  const documentsObservable = useMemo(() => {
    if (!enabled) {
      return of<BundleDocumentsResult<TResult>>({loading: false, results: [], error: null})
    }

    return getOrCreateBundleDocumentsObservable<TResult>(cacheKey, () =>
      getBundleDocumentsObservable<TResult>({
        schema,
        documentPreviewStore,
        i18n,
        getClient,
        currentUser,
        groqFilter,
        queryParams,
        clientOptions,
        observeDocument,
        mapDocument,
      }),
    )
  }, [
    cacheKey,
    enabled,
    schema,
    documentPreviewStore,
    i18n,
    getClient,
    currentUser,
    groqFilter,
    queryParams,
    clientOptions,
    observeDocument,
    mapDocument,
  ])

  return useObservable(documentsObservable, {loading: enabled, results: [], error: null})
}
