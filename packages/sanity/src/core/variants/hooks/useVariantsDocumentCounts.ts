import {type SanityClient} from '@sanity/client'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {type Observable, of} from 'rxjs'
import {catchError, distinctUntilChanged, map, scan, startWith, switchMap} from 'rxjs/operators'

import {useClient} from '../../hooks/useClient'
import {type InvalidationChannelEvent} from '../../preview/types'
import {useDocumentPreviewStore} from '../../store/datastores'
import {listenQueryOnGlobalListener} from '../../store/document/listenQuery'
import {isVersionId} from '../../util/draftUtils'
import {VARIANTS_STUDIO_CLIENT_OPTIONS} from '../store/constants'
import {type VariantStoreState} from '../store/reducer'
import {useVariantsStore} from '../store/useVariantsStore'
import {getVariantId} from '../tool/util'

/**
 * Builds a single aggregate query that counts the documents in each variant, returning one count
 * per variant keyed by variant definition document id (`_.variants.*`).
 *
 * Documents are counted per document group (`_system.group._ref`), so the count matches the
 * number of rows in the variant detail table, where versions of the same document are grouped.
 *
 * `sanity::partOfVariant()` matches on the short variant id (the `_.variants.` path prefix is
 * stripped via {@link getVariantId}).
 *
 * @internal
 */
export function buildVariantsDocumentCountsQuery(variantDocumentIds: string[]): string {
  const projections = variantDocumentIds.map((variantDocumentId) => {
    const membership = `sanity::partOfVariant(${JSON.stringify(getVariantId(variantDocumentId))})`
    return `${JSON.stringify(variantDocumentId)}: count(array::unique(*[${membership}]._system.group._ref))`
  })

  return `{${projections.join(',')}}`
}

/** @internal */
export interface VariantsDocumentCountsState {
  /**
   * Document counts keyed by variant definition document id (`_.variants.*`), or `null` before
   * the first fetch has completed (or after an error).
   */
  data: Record<string, number> | null
  loading: boolean
  error: Error | null
}

const INITIAL_STATE: VariantsDocumentCountsState = {data: null, loading: true, error: null}
const EMPTY_STATE: VariantsDocumentCountsState = {data: {}, loading: false, error: null}

/**
 * Fetches the document counts for one set of variants with one aggregate count query, and fetches
 * them again on changes reported by the preview store's shared global listener, via
 * {@link listenQueryOnGlobalListener}.
 */
function listenVariantsDocumentCounts(
  client: SanityClient,
  invalidationChannel: Observable<InvalidationChannelEvent>,
  variantDocumentIds: string[],
): Observable<VariantsDocumentCountsState> {
  if (variantDocumentIds.length === 0) {
    return of(EMPTY_STATE)
  }

  return listenQueryOnGlobalListener<Record<string, number>>(
    client,
    buildVariantsDocumentCountsQuery(variantDocumentIds),
    {
      invalidationChannel,
      // A variant document's id holds an opaque scope id instead of its variant, so a change to
      // any version document can change the counts.
      shouldRefetch: ({documentId}) => isVersionId(documentId),
      fetchTag: 'variants-doc-counts.fetch',
      // Variant-scoped documents are version documents, which are only visible to queries
      // using the raw perspective.
      perspective: 'raw',
    },
  ).pipe(
    map((response): VariantsDocumentCountsState => ({
      data: Object.fromEntries(
        variantDocumentIds.map((variantDocumentId) => [
          variantDocumentId,
          response?.[variantDocumentId] ?? 0,
        ]),
      ),
      loading: false,
      error: null,
    })),
    startWith(INITIAL_STATE),
    // catchError stays on this inner observable so the outer stream in
    // `getVariantsDocumentCounts` keeps reacting to variant list changes after a failure.
    catchError((error) => of({data: null, loading: false, error})),
  )
}

/**
 * Creates an observable that keeps a live count of the documents in each variant held by the
 * variants store.
 *
 * The variant ids are derived from the store's `state$`, so the returned observable never
 * needs to be recreated: when the set of variants changes, the counts of the new set are
 * fetched inside the same stream (`switchMap`), right away when the global listener is
 * connected. Previously fetched counts are carried across the switch (`scan`), so existing rows
 * don't flash back to a loading state.
 *
 * @internal
 */
export function getVariantsDocumentCounts(
  client: SanityClient,
  invalidationChannel: Observable<InvalidationChannelEvent>,
  variantsState$: Observable<VariantStoreState>,
): Observable<VariantsDocumentCountsState> {
  return variantsState$.pipe(
    // Document ids cannot contain commas, so a sorted joined string is a stable identity
    // key that lets `distinctUntilChanged` ignore store emissions (e.g. variant metadata
    // edits) that don't change the set of variants.
    map((state) => Array.from(state.variants.keys()).toSorted().join(',')),
    distinctUntilChanged(),
    switchMap((idsKey) =>
      listenVariantsDocumentCounts(client, invalidationChannel, idsKey ? idsKey.split(',') : []),
    ),
    scan(
      (previous, next): VariantsDocumentCountsState => ({
        // Keep the previous counts while the next fetch is loading (or errored), so counts
        // for unchanged variants remain visible across variant list changes.
        data: next.data ? {...previous.data, ...next.data} : previous.data,
        loading: next.loading && previous.data === null,
        error: next.error,
      }),
      INITIAL_STATE,
    ),
  )
}

/**
 * Keeps a live count of the documents in each variant, using a single aggregate count query
 * refetched on changes reported by the preview store's shared global listener (see
 * {@link getVariantsDocumentCounts}).
 *
 * @internal
 */
export function useVariantsDocumentCounts(): VariantsDocumentCountsState {
  const client = useClient(VARIANTS_STUDIO_CLIENT_OPTIONS)
  const previewStore = useDocumentPreviewStore()
  const {state$} = useVariantsStore()

  const observable = useMemo(
    () => getVariantsDocumentCounts(client, previewStore.unstable_invalidationChannel, state$),
    [client, previewStore, state$],
  )

  return useObservable(observable, INITIAL_STATE)
}
