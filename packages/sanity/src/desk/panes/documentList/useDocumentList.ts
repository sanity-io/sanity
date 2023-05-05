import {useCallback, useEffect, useMemo, useState} from 'react'
import {concat, EMPTY, fromEvent, merge, of, Subject} from 'rxjs'
import {catchError, map, mergeMap, scan, startWith, take} from 'rxjs/operators'
import {DocumentListPaneItem, QueryResult, SortOrder} from './types'
import {
  getTypeNameFromSingleTypeFilter,
  isSimpleTypeFilter,
  removePublishedWithDrafts,
} from './helpers'
import {DEFAULT_ORDERING, FULL_LIST_LIMIT, PARTIAL_PAGE_LIMIT} from './constants'
import {useDocumentTypeNames} from './hooks'
import {
  listenQuery,
  createSearchQuery,
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  SearchableType,
  SearchOptions,
  SearchTerms,
  useClient,
  useSchema,
  WeightedSearchOptions,
} from 'sanity'

const EMPTY_ARRAY: [] = []

const INITIAL_STATE: QueryResult = {
  error: null,
  isInitialLoading: true,
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
  const {apiVersion, filter, params: paramsProp, sortOrder, searchQuery} = opts
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const schema = useSchema()

  const [resultState, setResult] = useState<QueryResult>(INITIAL_STATE)
  const {onRetry, error, result, loading, isInitialLoading} = resultState

  const documents = result?.documents

  // Filter out published documents that have drafts to avoid duplicates in the list.
  const items = useMemo(
    () => (documents ? removePublishedWithDrafts(documents) : EMPTY_ARRAY),
    [documents]
  )

  // A state variable to keep track of whether we are currently lazy loading the list.
  // This is used to determine whether we should show the loading spinner at the bottom of the list.
  const [isLazyLoading, setIsLazyLoading] = useState<boolean>(false)

  // A flag to indicate whether we have reached the maximum number of documents.
  const hasMaxItems = documents?.length === FULL_LIST_LIMIT

  // A state to keep track of whether we have fetched the full list of documents.
  const [hasFullList, setHasFullList] = useState<boolean>(false)

  // A state to keep track of whether we should fetch the full list of documents.
  const [shouldFetchFullList, setShouldFetchFullList] = useState<boolean>(false)

  // Check if the filter is a simple type filter, e.g. `*[_type == "book"]` or `*[_type == $type]`
  const isSimpleFilter = isSimpleTypeFilter(filter)

  // Get the type name from the filter, if it is a simple type filter.
  const typeNameFromFilter = useMemo(
    () => getTypeNameFromSingleTypeFilter(filter, paramsProp),
    [filter, paramsProp]
  )

  // If the filter is a simple type filter, we can disable fetching the document types names.
  // This is because we already know the type name from the filter and params.
  const disableFetchTypeNames = Boolean(typeNameFromFilter && isSimpleFilter)

  // If the filter is not a simple type filter, we need to fetch the document types names
  // to use in the search query and in the listener for the list change.
  const {data: documentTypes, loading: loadingDocumentTypes} = useDocumentTypeNames({
    filter,
    params: paramsProp,
    disabled: disableFetchTypeNames,
  })

  // The document types names are used to build the search query and to listen for changes.
  // 1. If the filter is a simple type filter, we can use the type name directly.
  // 2. If the filter is a complex filter, we need to use the document types names that we have fetched.
  const uniqueTypesNames = useMemo(() => {
    if (disableFetchTypeNames && typeNameFromFilter) return [typeNameFromFilter]

    return [...new Set(documentTypes || EMPTY_ARRAY)]
  }, [documentTypes, typeNameFromFilter, disableFetchTypeNames])

  const noDocumentTypes = uniqueTypesNames.length === 0 && !loadingDocumentTypes

  const isLoading =
    Boolean(isInitialLoading && !noDocumentTypes) ||
    Boolean(loading && result === null && noDocumentTypes)

  // The search is ready to be interacted with when:
  // 1. The filter is a simple type filter and we have the type name from the filter.
  // 2. Or when the filter is not a simple type filter and we have fetched the document types names.
  const simpleFilterSearchReady = uniqueTypesNames.length > 0
  const complexFilterSearchReady = simpleFilterSearchReady && !loadingDocumentTypes
  const isSearchReady = isSimpleFilter ? simpleFilterSearchReady : complexFilterSearchReady

  // This function is triggered when the user has scrolled to the bottom of the list
  // and we need to fetch more items.
  const onListChange = useCallback(() => {
    if (isLoading || hasFullList || shouldFetchFullList) return

    setShouldFetchFullList(true)
  }, [isLoading, hasFullList, shouldFetchFullList])

  const handleSetResult = useCallback(
    (res: QueryResult) => {
      const documentsLength = res.result?.documents?.length || 0

      const isLoadingMoreItems = !res.error && res?.result === null && shouldFetchFullList

      // 1. When the result is null and shouldFetchFullList is true, we are loading _more_ items.
      // In this case, we want to set the loading states to true and wait for the next result.
      if (isLoadingMoreItems) {
        setResult((prev) => ({...prev, loading: true}))
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
      // set the loading state to true and wait for the next result.
      if (res?.result === null) {
        setResult((prev) => ({...prev, loading: true}))
        return
      }

      // 4. Finally, set the result and loading states to false.
      setIsLazyLoading(false)
      setResult({...res, loading: false})
    },
    [shouldFetchFullList]
  )

  const {params, query} = useMemo(() => {
    const sort = sortOrder?.by || DEFAULT_ORDERING?.by
    const extendedProjection = sortOrder?.extendedProjection || DEFAULT_ORDERING?.extendedProjection
    const limit = shouldFetchFullList ? FULL_LIST_LIMIT : PARTIAL_PAGE_LIMIT
    const types = uniqueTypesNames.flatMap((name) => schema.get(name) || []) as SearchableType[]

    const terms: SearchTerms = {
      filter,
      query: searchQuery || '',
      types,
    }

    const options: SearchOptions & WeightedSearchOptions = {
      __unstable_extendedProjection: extendedProjection,
      comments: [`findability-source: ${searchQuery ? 'list-query' : 'list'}`],
      limit,
      params: paramsProp,
      sort,
    }

    return createSearchQuery(terms, options)
  }, [
    filter,
    paramsProp,
    schema,
    searchQuery,
    shouldFetchFullList,
    sortOrder?.by,
    sortOrder?.extendedProjection,
    uniqueTypesNames,
  ])

  const queryResults$ = useMemo(() => {
    if (uniqueTypesNames.length === 0) {
      return EMPTY
    }
    const onRetry$ = new Subject<void>()
    const _onRetry = () => onRetry$.next()

    return listenQuery(
      client,
      {
        // The query is too big to be used with a listener. To work around this, we use a
        // listener to listen for mutations on the document types, and then re-run the query
        // to get the updated list of documents when a mutation occurs.
        listen: '*[_type in $__types]',
        fetch: query,
      },
      {...params, __types: uniqueTypesNames},
      {
        apiVersion,
        tag: 'desk.document-list',
      }
    ).pipe(
      map((results) => ({
        result: {documents: results},
        error: null,
      })),
      startWith(INITIAL_QUERY_RESULTS),
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
  }, [apiVersion, client, params, query, uniqueTypesNames])

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
  }, [reset, filter, paramsProp, sortOrder, searchQuery, uniqueTypesNames])

  return {
    error,
    hasMaxItems,
    isLazyLoading,
    isLoading,
    isSearchReady,
    items,
    onListChange,
    onRetry,
  }
}
