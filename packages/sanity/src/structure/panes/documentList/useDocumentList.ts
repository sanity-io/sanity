import {type ClientPerspective} from '@sanity/client'
import {observableCallback} from 'observable-callback'
import {useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import {concat, fromEvent, merge, of} from 'rxjs'
import {
  catchError,
  filter,
  map,
  mergeMap,
  scan,
  share,
  shareReplay,
  take,
  takeUntil,
  withLatestFrom,
} from 'rxjs/operators'
import {
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  useClient,
  useSchema,
  useSearchMaxFieldDepth,
  useWorkspace,
} from 'sanity'

import {DEFAULT_ORDERING, FULL_LIST_LIMIT, PARTIAL_PAGE_LIMIT} from './constants'
import {findStaticTypesInFilter, removePublishedWithDrafts} from './helpers'
import {listenSearchQuery} from './listenSearchQuery'
import {type DocumentListPaneItem, type SortOrder} from './types'

interface UseDocumentListOpts {
  apiVersion?: string
  filter: string
  perspective?: ClientPerspective
  params: Record<string, unknown>
  searchQuery: string | null
  sortOrder?: SortOrder
}

interface DocumentListState {
  error: {message: string} | null
  isLoadingFullList: boolean
  isLoading: boolean
  fromCache?: boolean
  items: DocumentListPaneItem[]
}

const INITIAL_QUERY_STATE: DocumentListState = {
  error: null,
  isLoading: true,
  isLoadingFullList: false,
  fromCache: false,
  items: [],
}

interface UseDocumentListHookValue extends DocumentListState {
  onRetry: () => void
  onLoadFullList: () => void
}

/**
 * @internal
 */
export function useDocumentList(opts: UseDocumentListOpts): UseDocumentListHookValue {
  const {
    filter: searchFilter,
    params: paramsProp,
    sortOrder,
    searchQuery,
    perspective,
    apiVersion,
  } = opts
  const client = useClient({
    ...DEFAULT_STUDIO_CLIENT_OPTIONS,
    apiVersion: apiVersion || DEFAULT_STUDIO_CLIENT_OPTIONS.apiVersion,
  })
  const {strategy: searchStrategy} = useWorkspace().search
  const schema = useSchema()
  const maxFieldDepth = useSearchMaxFieldDepth()

  // Get the type name from the filter, if it is a simple type filter.
  const typeNameFromFilter = useMemo(
    () => findStaticTypesInFilter(searchFilter, paramsProp),
    [searchFilter, paramsProp],
  )

  const [[onRetry$, onRetry]] = useState(() => observableCallback())
  const [[onFetchFullList$, onLoadFullList]] = useState(() => observableCallback())

  const queryResults$ = useMemo(() => {
    const listenSearchQueryArgs = {
      client,
      filter: searchFilter,
      limit: PARTIAL_PAGE_LIMIT,
      params: paramsProp,
      schema,
      perspective,
      searchQuery: searchQuery || '',
      sort: sortOrder || DEFAULT_ORDERING,
      staticTypeNames: typeNameFromFilter,
      maxFieldDepth,
      searchStrategy,
    }

    const partialList$ = listenSearchQuery(listenSearchQueryArgs).pipe(
      shareReplay({refCount: true, bufferSize: 1}),
    )

    // we want to fetch the full list if the last result of the partial list is at the limit
    const fullList$ = onFetchFullList$.pipe(
      withLatestFrom(partialList$),
      filter(([, result]) => result?.documents.length === PARTIAL_PAGE_LIMIT),
      // we want to set up the full list listener only once
      take(1),
      mergeMap(() =>
        concat(
          of({type: 'loadFullList' as const}),
          listenSearchQuery({...listenSearchQueryArgs, limit: FULL_LIST_LIMIT}).pipe(
            map((result) => ({type: 'result' as const, result})),
          ),
        ),
      ),
      share(),
    )

    // The combined search results from both partial page and full list
    return merge(
      partialList$.pipe(
        map((result) => ({
          type: 'result' as const,
          result,
        })),
        // when the full list listener kicks off, we want to stop the partial list listener
        takeUntil(fullList$),
      ),
      fullList$,
    ).pipe(
      catchError((err: unknown, caught$) => {
        return concat(
          of({type: 'error' as const, error: safeError(err)}),
          merge(fromEvent(window, 'online'), onRetry$).pipe(
            take(1),
            mergeMap(() => caught$),
          ),
        )
      }),
      scan((prev, event) => {
        if (event.type === 'error') {
          return {
            ...prev,
            error: event.error,
          }
        }
        if (event.type === 'result') {
          return {
            ...prev,
            error: null,
            fromCache: event.result.fromCache,
            isLoading: false,
            items: removePublishedWithDrafts(event.result.documents),
            isLoadingFullList: false,
          }
        }
        if (event.type === 'loadFullList') {
          return {
            ...prev,
            error: null,
            isLoadingFullList: true,
          }
        }
        throw new Error('Unexpected')
      }, INITIAL_QUERY_STATE),
    )
  }, [
    client,
    searchFilter,
    paramsProp,
    schema,
    perspective,
    searchQuery,
    sortOrder,
    typeNameFromFilter,
    maxFieldDepth,
    searchStrategy,
    onFetchFullList$,
    onRetry$,
  ])

  const {error, items, isLoading, fromCache, isLoadingFullList} = useObservable(
    queryResults$,
    INITIAL_QUERY_STATE,
  )

  return {
    error,
    onRetry,
    isLoading,
    items,
    fromCache,
    onLoadFullList,
    isLoadingFullList,
  }
}

// todo: candidate for re-use
const nonErrorThrownWarning = `[WARNING: This was thrown as a non-error. Only Error instances should be thrown]`
function safeError(thrown: unknown): Error {
  if (thrown instanceof Error) {
    return thrown
  }
  if (typeof thrown === 'object' && thrown !== null) {
    if ('message' in thrown && typeof thrown.message === 'string') {
      return new Error(`${thrown.message} ${nonErrorThrownWarning}`)
    }
    return new Error(`${String(thrown)} ${nonErrorThrownWarning}`)
  }
  return new Error(`${String(thrown)} ${nonErrorThrownWarning}`)
}
