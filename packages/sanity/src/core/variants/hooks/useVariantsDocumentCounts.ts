import {type SanityClient} from '@sanity/client'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {type Observable, of} from 'rxjs'
import {catchError, map, startWith} from 'rxjs/operators'

import {useClient} from '../../hooks'
import {listenQuery} from '../../store'
import {VARIANTS_STUDIO_CLIENT_OPTIONS} from '../store/constants'
import {getVariantId} from '../tool/util'

/**
 * The fetch and listen GROQ queries used to keep per-variant document counts fresh.
 *
 * @internal
 */
export interface VariantsDocumentCountsQuery {
  /**
   * Aggregate object query returning one count per variant, keyed by variant definition
   * document id (`_.variants.*`).
   */
  fetch: string
  /** Filter matching every document in any of the variants, used for the single listener. */
  listen: string
}

/**
 * Builds a single aggregate fetch query that counts the documents in each variant, and a
 * single listen filter covering all of them.
 *
 * Documents are counted per document group (`_system.group._ref`), so the count matches the
 * number of rows in the variant detail table, where versions of the same document are grouped.
 *
 * `sanity::partOfVariant()` matches on the short variant id (the `_.variants.` path prefix is
 * stripped via {@link getVariantId}).
 *
 * @internal
 */
export function buildVariantsDocumentCountsQuery(
  variantDocumentIds: string[],
): VariantsDocumentCountsQuery {
  const projections: string[] = []
  const filters: string[] = []

  for (const variantDocumentId of variantDocumentIds) {
    const membership = `sanity::partOfVariant(${JSON.stringify(getVariantId(variantDocumentId))})`

    projections.push(
      `${JSON.stringify(variantDocumentId)}: count(array::unique(*[${membership}]._system.group._ref))`,
    )
    filters.push(membership)
  }

  return {
    fetch: `{${projections.join(',')}}`,
    listen: `*[${filters.join(' || ')}]`,
  }
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
 * Creates an observable that keeps a live count of the documents in each of the given
 * variants.
 *
 * Uses a single listener (one OR-chained `sanity::partOfVariant()` filter covering all
 * variants) that triggers a throttled refetch of one aggregate count query, via
 * {@link listenQuery}.
 *
 * @internal
 */
export function getVariantsDocumentCounts(
  client: SanityClient,
  variantDocumentIds: string[],
): Observable<VariantsDocumentCountsState> {
  if (variantDocumentIds.length === 0) {
    return of(EMPTY_STATE)
  }

  const {fetch, listen} = buildVariantsDocumentCountsQuery(variantDocumentIds)

  return listenQuery(
    client,
    {fetch, listen},
    {},
    // Variant-scoped documents are version documents, which are only visible to queries
    // using the raw perspective.
    {tag: 'variants-doc-counts.listen', perspective: 'raw'},
  ).pipe(
    map(
      (response: Record<string, number>): VariantsDocumentCountsState => ({
        data: Object.fromEntries(
          variantDocumentIds.map((variantDocumentId) => [
            variantDocumentId,
            response?.[variantDocumentId] ?? 0,
          ]),
        ),
        loading: false,
        error: null,
      }),
    ),
    startWith(INITIAL_STATE),
    catchError((error) => of({data: null, loading: false, error})),
  )
}

/**
 * Keeps a live count of the documents in each of the given variants, using a single listener
 * and a single aggregate count query (see {@link getVariantsDocumentCounts}).
 *
 * When the set of variant ids changes, the previous listener is closed and a new one is
 * opened — there is never more than one active listener — and the counts reload.
 *
 * @internal
 */
export function useVariantsDocumentCounts(
  variantDocumentIds: string[],
): VariantsDocumentCountsState {
  const client = useClient(VARIANTS_STUDIO_CLIENT_OPTIONS)

  // Document ids cannot contain commas, so a sorted joined string is a stable identity key
  // that ignores array identity and ordering.
  const idsKey = useMemo(() => variantDocumentIds.toSorted().join(','), [variantDocumentIds])

  const observable = useMemo(
    () => getVariantsDocumentCounts(client, idsKey ? idsKey.split(',') : []),
    [client, idsKey],
  )

  return useObservable(observable, INITIAL_STATE)
}
