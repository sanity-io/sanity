import {distinctUntilChanged, filter, map, type Observable, of, startWith, switchMap} from 'rxjs'
import {mergeMapArray} from 'rxjs-mergemap-array'
import {
  type DocumentPreviewStore,
  getPublishedId,
  type SanityClient,
  type SanityDocument,
} from 'sanity'

import {type IncomingReferencesFilterResolver, type IncomingReferencesOptions} from './types'

export const INITIAL_STATE = {
  documents: [],
  loading: true,
}

async function resolveRawFilterCallback(
  filterResolver: IncomingReferencesFilterResolver,
  {
    document,
    getClient,
  }: {document: SanityDocument; getClient: (options: {apiVersion: string}) => SanityClient},
) {
  const resolvedFilter = await filterResolver({document, getClient})
  if (typeof resolvedFilter === 'string') {
    return {filter: resolvedFilter, filterParams: undefined}
  }
  return resolvedFilter
}

interface InputIncomingReferencesOptions {
  documentId: string
  documentPreviewStore: DocumentPreviewStore
  getClient: (options: {apiVersion: string}) => SanityClient
  type?: string
  filter?: IncomingReferencesOptions['filter']
  filterParams?: IncomingReferencesOptions['filterParams']
}

interface InspectorIncomingReferencesOptions {
  documentId: string
  documentPreviewStore: DocumentPreviewStore
  getClient: (options: {apiVersion: string}) => SanityClient
  type?: undefined
  filter?: undefined
  filterParams?: undefined
}

export function getIncomingReferences({
  documentId,
  documentPreviewStore,
  type,
  filter: filterQueryRaw,
  filterParams: filterParamsRaw,
  getClient,
}: InspectorIncomingReferencesOptions | InputIncomingReferencesOptions): Observable<{
  documents: SanityDocument[]
  loading: boolean
}> {
  const publishedId = getPublishedId(documentId)
  const filterResolver: Observable<{
    filter: string | undefined
    filterParams?: Record<string, unknown> | undefined
  }> =
    typeof filterQueryRaw === 'function'
      ? documentPreviewStore.unstable_observeDocument(documentId).pipe(
          distinctUntilChanged((a, b) => a?._rev === b?._rev),
          switchMap((document) =>
            resolveRawFilterCallback(filterQueryRaw, {
              document: document as SanityDocument,
              getClient,
            }),
          ),
          map((resolvedFilter) => ({
            filter: resolvedFilter.filter,
            filterParams: resolvedFilter.filterParams || filterParamsRaw,
          })),
        )
      : of({filter: filterQueryRaw, filterParams: filterParamsRaw})

  return filterResolver.pipe(
    distinctUntilChanged(
      (a, b) =>
        a.filter === b.filter && JSON.stringify(a.filterParams) === JSON.stringify(b.filterParams),
    ),
    switchMap(({filter: filterQuery, filterParams}) => {
      return documentPreviewStore
        .unstable_observeDocumentIdSet(
          `references("${publishedId}") ${type ? `&& _type == "${type}"` : ''} ${filterQuery ? `&& ${filterQuery}` : ''}`,
          filterParams,
          {insert: 'append'},
        )
        .pipe(
          map((state) => state.documentIds),
          mergeMapArray((id: string) => {
            return documentPreviewStore.unstable_observeDocument(id).pipe(
              filter(Boolean),
              map((doc) => doc),
            )
          }),
          // Remove duplicates due to different versions of the same document.
          map((documents) => {
            const seenPublishedId: string[] = []
            return documents.filter((doc) => {
              const pId = getPublishedId(doc._id)
              if (seenPublishedId.includes(pId)) return false
              seenPublishedId.push(pId)
              return true
            })
          }),

          map((documents) => ({documents, loading: false})),
          startWith(INITIAL_STATE),
        )
    }),
  )
}
