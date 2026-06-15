import {type QueryParams, type SanityClient} from '@sanity/client'
import deepEquals from 'react-fast-compare'
import {of} from 'rxjs'
import {distinctUntilChanged, filter, map, mergeMap, scan, tap} from 'rxjs/operators'

import {type SourceClientOptions} from '../config/types'
import {versionedClient} from '../studioClient'

/**
 * The minimal shape every observed document is guaranteed to have. `_id` is used
 * to key the set, while `_rev` is used to detect when a document's content has
 * actually changed between emissions.
 */
export interface DocumentSetObserverDocumentStub {
  _id: string
  _rev?: string
}

export type DocumentSetObserverState<
  T extends DocumentSetObserverDocumentStub = DocumentSetObserverDocumentStub,
> = {
  status: 'reconnecting' | 'connected'
  documents: T[]
}

interface LiveDocumentSetOptions {
  apiVersion?: SourceClientOptions['apiVersion']
}

type DocumentSetAccumulator<T extends DocumentSetObserverDocumentStub> = {
  status: 'reconnecting' | 'connected'
  documentsById: Map<string, T>
}

/**
 * Creates an observer that resolves the matching documents (projected to the requested fields) in a single query
 *
 * The set is fetched once initially (on `welcome`) and is thereafter kept in sync
 * incrementally from the listener, *without refetching*:
 * - `appear` — the document is projected from the event result and added to the set
 * - `update` — the document is reprojected from the event result and replaced in place
 * - `disappear` — the document is removed from the set
 *
 * Because updates are applied directly from the mutation event `result` (the document as
 * it looked after the mutation), the listener is configured with `includeResult: true`.
 *
 * @internal
 */
export function createDocumentSetObserver(client: SanityClient) {
  return function observe<T extends DocumentSetObserverDocumentStub>(
    queryFilter: string,
    projection: string[],
    params?: QueryParams,
    options: LiveDocumentSetOptions = {},
  ) {
    const {apiVersion} = options
    // `_id` is always required so we can key the set
    const fields = ['_id', ...projection.filter((field) => field !== '_id')]
    const query = `*[${queryFilter}]{${fields.join(',')}}`

    /**
     * Projects a full document (received as a listener event `result`) down to the
     * requested fields, mirroring what the GROQ projection returns on initial fetch.
     */
    function projectDocument(document: Record<string, unknown>): T {
      const projected: Record<string, unknown> = {}
      for (const field of fields) {
        projected[field] = document[field]
      }
      return projected as T
    }

    function fetchDocuments() {
      return versionedClient(client, apiVersion)
        .observable.fetch<T[]>(query, params ?? {}, {
          tag: 'preview.observe-document-set.fetch',
        })
        .pipe(
          tap((result) => {
            if (!Array.isArray(result)) {
              throw new Error(
                `Expected query to return array of documents, but got ${typeof result}`,
              )
            }
          }),
        )
    }

    return versionedClient(client, apiVersion)
      .observable.listen(`*[${queryFilter}]`, params, {
        visibility: 'query',
        events: ['welcome', 'mutation', 'reconnect'],
        includeResult: true,
        includeMutations: false,
        includeAllVersions: true,
        tag: 'preview.observe-document-set.live-document-set',
      })
      .pipe(
        // The initial `welcome` triggers a single fetch of the whole set; every other
        // event is passed through and applied incrementally in `scan` below.
        mergeMap((event) =>
          event.type === 'welcome'
            ? fetchDocuments().pipe(map((documents) => ({type: 'fetch' as const, documents})))
            : of(event),
        ),
        scan((state: DocumentSetAccumulator<T> | undefined, event): DocumentSetAccumulator<T> => {
          const documentsById = state?.documentsById ?? new Map<string, T>()

          if (event.type === 'reconnect') {
            return {status: 'reconnecting', documentsById}
          }

          if (event.type === 'fetch') {
            const nextDocumentsById = new Map<string, T>()
            for (const document of event.documents) {
              nextDocumentsById.set(document._id, document)
            }
            return {status: 'connected', documentsById: nextDocumentsById}
          }

          if (event.type === 'mutation') {
            if (event.transition === 'disappear') {
              documentsById.delete(event.documentId)
              return {status: 'connected', documentsById}
            }

            // `appear` and `update` carry the document in `result` (the listener is
            // configured with `includeResult: true`). If it's missing for any reason,
            // keep the current state rather than dropping the document.
            if (!event.result) {
              return {status: 'connected', documentsById}
            }

            documentsById.set(event.documentId, projectDocument(event.result))
            return {status: 'connected', documentsById}
          }

          return state ?? {status: 'connected', documentsById}
        }, undefined),
        filter(
          (state: DocumentSetAccumulator<T> | undefined): state is DocumentSetAccumulator<T> =>
            state !== undefined,
        ),
        map(
          (state): DocumentSetObserverState<T> => ({
            status: state.status,
            documents: Array.from(state.documentsById.values()),
          }),
        ),
        distinctUntilChanged(isSameState),
      )
  }
}

function isSameState<T extends DocumentSetObserverDocumentStub>(
  a: DocumentSetObserverState<T>,
  b: DocumentSetObserverState<T>,
): boolean {
  if (a.status !== b.status) {
    return false
  }
  if (a.documents.length !== b.documents.length) {
    return false
  }

  const docsB = new Map(b.documents.map((document) => [document._id, document]))
  return a.documents.every((docA) => {
    const docB = docsB.get(docA._id)
    return deepEquals(docA, docB)
  })
}
