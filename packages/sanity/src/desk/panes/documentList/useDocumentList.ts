import {useCallback, useEffect, useMemo, useState} from 'react'
import {concat, fromEvent, merge, of, Subject, throwError} from 'rxjs'
import {catchError, map, mergeMap, scan, startWith, take} from 'rxjs/operators'
import {DocumentListPaneItem, QueryResult, SortOrder} from './types'
import {getTypeNameFromSingleTypeFilter, removePublishedWithDrafts} from './helpers'
import {DEFAULT_ORDERING, FULL_LIST_LIMIT, PARTIAL_PAGE_LIMIT} from './constants'
import {listenSearchQuery} from './listenSearchQuery'
import {DEFAULT_STUDIO_CLIENT_OPTIONS, useClient, useSchema} from 'sanity'

const EMPTY_ARRAY: [] = []

const INITIAL_STATE: QueryResult = {
  error: null,
  onRetry: undefined,
  result: null,
}

interface UseDocumentListOpts {
  apiVersion?: string
  filter: string
  params: Record<string, unknown>
  searchQuery: string | null
  sortOrder?: SortOrder
}

interface DocumentListState {
  error: {message: string} | null
  hasMaxItems?: boolean
  isLazyLoading: boolean
  isLoading: boolean
  isSearchReady: boolean
  items: DocumentListPaneItem[]
  onListChange: () => void
  onRetry?: (event: unknown) => void
}

const INITIAL_QUERY_RESULTS: QueryResult = {
  result: null,
  error: null,
}

/**
 * @internal
 */
export function useDocumentList(opts: UseDocumentListOpts): DocumentListState {
  const {filter, params: paramsProp, sortOrder, searchQuery} = opts
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const schema = useSchema()

  const [resultState, setResult] = useState<QueryResult>(INITIAL_STATE)
  const {onRetry, error, result} = resultState

  const documents = result?.documents

  // Filter out published documents that have drafts to avoid duplicates in the list.
  const items = useMemo(
    () => (documents ? removePublishedWithDrafts(documents) : EMPTY_ARRAY),
    [documents]
  )

  // A state variable to keep track of whether we are currently lazy loading the list.
  // This is used to determine whether we should show the loading spinner at the bottom of the list.
  const [isLazyLoading, setIsLazyLoading] = useState<boolean>(false)

  // A state to keep track of whether we have fetched the full list of documents.
  const [hasFullList, setHasFullList] = useState<boolean>(false)

  // A state to keep track of whether we should fetch the full list of documents.
  const [shouldFetchFullList, setShouldFetchFullList] = useState<boolean>(false)

  // Get the type name from the filter, if it is a simple type filter.
  const typeNameFromFilter = useMemo(
    () => getTypeNameFromSingleTypeFilter(filter, paramsProp),
    [filter, paramsProp]
  )

  // We can't have the loading state as part of the result state, since the loading
  // state would be updated whenever a mutation is performed in a document in the list.
  // Instead, we determine if the list is loading by checking if the result is null.
  // The result is null when:
  // 1. We are making the initial request
  // 2. The user has performed a search or changed the sort order
  const isLoading = result === null && !error

  // A flag to indicate whether we have reached the maximum number of documents.
  const hasMaxItems = documents?.length === FULL_LIST_LIMIT

  // This function is triggered when the user has scrolled to the bottom of the list
  // and we need to fetch more items.
  const onListChange = useCallback(() => {
    if (isLoading || hasFullList || shouldFetchFullList) return

    setShouldFetchFullList(true)
  }, [isLoading, hasFullList, shouldFetchFullList])

  const handleSetResult = useCallback(
    (res: QueryResult) => {
      if (res.error) {
        setResult(res)
        return
      }

      const documentsLength = res.result?.documents?.length || 0
      const isLoadingMoreItems = !res.error && res?.result === null && shouldFetchFullList

      // 1. When the result is null and shouldFetchFullList is true, we are loading _more_ items.
      // In this case, we want to wait for the next result and set the isLazyLoading state to true.
      if (isLoadingMoreItems) {
        setIsLazyLoading(true)
        return
      }

      // 2. If the result is not null, and less than the partial page limit, we know that
      // we have fetched the full list of documents. In this case, we want to set the
      // hasFullList state to true to prevent further requests.
      if (documentsLength < PARTIAL_PAGE_LIMIT && documentsLength !== 0 && !shouldFetchFullList) {
        setHasFullList(true)
      }

      // 3. If the result is null, we are loading items. In this case, we want to
      // wait for the next result.
      if (res?.result === null) {
        setResult((prev) => ({...(prev.error ? res : prev)}))
        return
      }

      // 4. Finally, set the result
      setIsLazyLoading(false)
      setResult(res)
    },
    [shouldFetchFullList]
  )

  const queryResults$ = useMemo(() => {
    const onRetry$ = new Subject<void>()
    const _onRetry = () => onRetry$.next()

    const limit = shouldFetchFullList ? FULL_LIST_LIMIT : PARTIAL_PAGE_LIMIT
    const sort = sortOrder || DEFAULT_ORDERING

    return listenSearchQuery({
      client,
      filter,
      limit,
      params: paramsProp,
      schema,
      searchQuery: searchQuery || '',
      sort,
      staticTypeNames: typeNameFromFilter ? [typeNameFromFilter] : undefined,
    }).pipe(
      map((results) => ({
        result: {documents: results},
        error: null,
      })),
      startWith(INITIAL_QUERY_RESULTS),
      catchError((err) => {
        if (err instanceof ProgressEvent) {
          // todo: hack to work around issue with get-it (used by sanity/client) that propagates connection errors as ProgressEvent instances. This if-block can be removed once @sanity/client is par with a version of get-it that includes this fix: https://github.com/sanity-io/get-it/pull/127
          return throwError(() => new Error(`Request error`))
        }
        return throwError(() => err)
      }),
      catchError((err, caught$) => {
        return concat(
          of({result: null, error: err}),
          merge(fromEvent(window, 'online'), onRetry$).pipe(
            take(1),
            mergeMap(() => caught$)
          )
        )
      }),
      scan((prev, next) => ({...prev, ...next, onRetry: _onRetry}))
    )
  }, [
    client,
    filter,
    paramsProp,
    schema,
    searchQuery,
    shouldFetchFullList,
    sortOrder,
    typeNameFromFilter,
  ])

  useEffect(() => {
    const sub = queryResults$.subscribe(handleSetResult)

    return () => {
      sub.unsubscribe()
    }
  }, [handleSetResult, queryResults$])

  const reset = useCallback(() => {
    setHasFullList(false)
    setIsLazyLoading(false)
    setResult(INITIAL_STATE)
    setShouldFetchFullList(false)
  }, [])

  useEffect(() => {
    reset()
  }, [reset, filter, paramsProp, sortOrder, searchQuery])

  return {
    error,
    hasMaxItems,
    isLazyLoading,
    isLoading,
    isSearchReady: !error,
    items,
    onListChange,
    onRetry,
  }
}
