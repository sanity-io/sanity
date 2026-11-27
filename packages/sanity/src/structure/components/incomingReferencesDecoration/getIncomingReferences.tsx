import {dequal} from 'dequal/lite'
import {catchError, distinctUntilChanged, filter, map, type Observable, of, switchMap} from 'rxjs'
import {mergeMapArray} from 'rxjs-mergemap-array'
import {
  type DocumentPreviewStore,
  getPublishedId,
  type SanityClient,
  type SanityDocument,
} from 'sanity'

import {type IncomingReferencesFilterResolver, type IncomingReferencesOptions} from './types'

async function resolveRawFilterCallback(
  filterResolver: IncomingReferencesFilterResolver,
  {
    document,
    getClient,
  }: {
    document: SanityDocument | undefined
    getClient: (options: {apiVersion: string}) => SanityClient
  },
) {
  const resolvedFilter = await filterResolver({document, getClient})
  if (typeof resolvedFilter === 'string') {
    return {filter: resolvedFilter, filterParams: undefined}
  }
  return resolvedFilter
}

interface ResolvedIncomingReferencesFilter {
  filter: string | undefined
  filterParams?: Record<string, unknown> | undefined
}

/**
 * Resolves the configured incoming-references `filter` (a static string or a resolver
 * function) into a concrete GROQ filter string + params. The function form is resolved
 * against the displayed document and re-resolved when its revision changes.
 *
 * Shared so both the rendered list and the "link existing" search apply the same filter.
 *
 * @internal
 */
export function resolveIncomingReferencesFilter({
  documentId,
  documentPreviewStore,
  getClient,
  filter: filterQueryRaw,
  filterParams: filterParamsRaw,
}: {
  documentId: string
  documentPreviewStore: DocumentPreviewStore
  getClient: (options: {apiVersion: string}) => SanityClient
  filter?: IncomingReferencesOptions['filter']
  filterParams?: IncomingReferencesOptions['filterParams']
}): Observable<ResolvedIncomingReferencesFilter> {
  return typeof filterQueryRaw === 'function'
    ? documentPreviewStore.unstable_observeDocument(documentId).pipe(
        distinctUntilChanged((a, b) => a?._rev === b?._rev),
        switchMap((document) =>
          resolveRawFilterCallback(filterQueryRaw, {
            document: document as SanityDocument | undefined,
            getClient,
          }),
        ),
        map((resolvedFilter) => ({
          filter: resolvedFilter.filter,
          filterParams: resolvedFilter.filterParams || filterParamsRaw,
        })),
      )
    : of({filter: filterQueryRaw, filterParams: filterParamsRaw})
}

export interface IncomingReferencesResult {
  documents: SanityDocument[]
  resolvedFilter: ResolvedIncomingReferencesFilter
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

/**
 * Emits the documents referencing `documentId` and their resolved filter. The observable does not emit
 * until the first list has loaded — consumers read it through
 * `useObservablePromise`, so the pending window renders as a Suspense fallback.
 */
export function getIncomingReferences({
  documentId,
  documentPreviewStore,
  type,
  filter: filterQueryRaw,
  filterParams: filterParamsRaw,
  getClient,
}:
  | InspectorIncomingReferencesOptions
  | InputIncomingReferencesOptions): Observable<IncomingReferencesResult> {
  const publishedId = getPublishedId(documentId)
  const filterResolver = resolveIncomingReferencesFilter({
    documentId,
    documentPreviewStore,
    getClient,
    filter: filterQueryRaw,
    filterParams: filterParamsRaw,
  })

  return filterResolver.pipe(
    distinctUntilChanged((a, b) => a.filter === b.filter && dequal(a.filterParams, b.filterParams)),
    switchMap(({filter: filterQuery, filterParams}) => {
      const resolvedFilter = {filter: filterQuery, filterParams}
      return documentPreviewStore
        .unstable_observeDocumentIdSet(
          `references("${publishedId}") && _system.group._ref != "${publishedId}" ${type ? `&& _type == "${type}"` : ''} ${filterQuery ? `&& ${filterQuery}` : ''}`,
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
          // Catch inside the `switchMap` so a failure of this inner stream
          // degrades to an empty list without completing the outer observable.
          // Consumers read this via `useObservablePromise`, so an uncaught
          // error would reject the promise and crash the document pane at the
          // nearest error boundary. Keeping the outer stream alive means a
          // later `filterResolver` emission can re-subscribe and recover from
          // a transient error.
          catchError((err) => {
            console.error(new Error('Failed to load incoming references', {cause: err}))
            return of<SanityDocument[]>([])
          }),
          map((documents) => ({documents, resolvedFilter})),
        )
    }),
  )
}
