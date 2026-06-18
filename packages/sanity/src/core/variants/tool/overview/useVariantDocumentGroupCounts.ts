import {type SanityClient} from '@sanity/client'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {catchError, map, type Observable, of, shareReplay, startWith} from 'rxjs'

import {listenQuery} from '../../../store'
import {useSource} from '../../../studio'
import {
  VARIANT_DOCUMENTS_PATH,
  VARIANT_DOCUMENT_TYPE,
  VARIANTS_STUDIO_CLIENT_OPTIONS,
} from '../../store/constants'

const VARIANT_DOCUMENT_COUNTS_QUERY = `*[_type=="${VARIANT_DOCUMENT_TYPE}" && _id in path("${VARIANT_DOCUMENTS_PATH}.*")]{
  _id,
  "documentsCount": count(*[_system.variant._ref == ^._id])
}`

interface VariantDocumentCountResult {
  _id: string
  documentsCount: number
}

let countsObservable: Observable<Map<string, number>> | undefined

/** @internal */
export function resetVariantDocumentGroupCountsCacheForTests(): void {
  countsObservable = undefined
}

function toVariantDocumentGroupCountsMap(
  results: VariantDocumentCountResult[],
): Map<string, number> {
  return new Map(results.map((result) => [result._id, result.documentsCount ?? 0]))
}

function getVariantDocumentGroupCountsObservable(
  client: SanityClient,
): Observable<Map<string, number>> {
  if (!countsObservable) {
    countsObservable = listenQuery(
      client,
      VARIANT_DOCUMENT_COUNTS_QUERY,
      {},
      {
        tag: 'variants.document-group-counts.listen',
        apiVersion: VARIANTS_STUDIO_CLIENT_OPTIONS.apiVersion,
      },
    ).pipe(
      map(toVariantDocumentGroupCountsMap),
      catchError(() => of(new Map<string, number>())),
      shareReplay(1),
    )
  }

  return countsObservable
}

/**
 * @internal
 */
export function useVariantDocumentGroupCounts(): Map<string, number> {
  const {getClient} = useSource()
  const client = getClient(VARIANTS_STUDIO_CLIENT_OPTIONS)

  const observable = useMemo(() => getVariantDocumentGroupCountsObservable(client), [client])

  return useObservable(observable.pipe(startWith(new Map<string, number>())), new Map())
}
