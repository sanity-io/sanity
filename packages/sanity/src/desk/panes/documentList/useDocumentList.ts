import {useEffect, useState, useCallback, useMemo} from 'react'
import {EMPTY, concat, of, switchMap} from 'rxjs'
import {DocumentListPaneItem, QueryResult, SortOrder} from './types'
import {isSimpleTypeFilter, removePublishedWithDrafts} from './helpers'
import {DEFAULT_ORDERING, FULL_LIST_LIMIT, PARTIAL_PAGE_LIMIT} from './constants'
import {getQueryResults} from './getQueryResults'
import {useDocumentTypeNames} from './hooks'
import {
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  FIXME,
  useClient,
  useSchema,
  createSearchQuery,
  SearchableType,
  SearchOptions,
  SearchTerms,
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

  // Check if the filter is a simple filter (i.e. a filter that only contains a single document type).
  const isSimpleFilter = isSimpleTypeFilter(filter)

  // Fetch the names of all document types that match the filter and params.
  // This allows us to search for documents of all types in the list.
  const {data: fetchedTypeNames, loading: loadingDocumentTypes} = useDocumentTypeNames({
    filter,
    params: paramsProp,
    // Disable the hook if the filter is a simple filter.
    disabled: isSimpleFilter,
  })

  const isLoading = isInitialLoading || Boolean(loading && result === null)

  // The document types to use for the search query.
  const typeNames = useMemo(() => {
    const typeFromParams = paramsProp?.type as string

    return [...new Set((isSimpleFilter ? [typeFromParams] : fetchedTypeNames) || EMPTY_ARRAY)]
  }, [isSimpleFilter, fetchedTypeNames, paramsProp?.type])

  const onListChange = useCallback(() => {
    if (isLoading || hasFullList || shouldFetchFullList) return

    setShouldFetchFullList(true)
  }, [isLoading, hasFullList, shouldFetchFullList])

  const handleSetResult = useCallback(
    (res: QueryResult) => {
      const documentsLength = res.result?.documents?.length || 0

      const isLoadingMoreItems = !res.error && res?.result === null && shouldFetchFullList

      // 1. When the result is null, we are loading more items. In this case, we want to
      // set the loading state to true and wait for the next result.
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

      // 3. If the result is null, we are loading more items. In this case, we want to
      // set the loading state to true and wait for the next result.
      if (res?.result === null) {
        setResult((prev) => ({...prev, loading: true}))

        return
      }

      // 4. Finally, set the result and loading state to false.
      setIsLazyLoading(false)
      setResult({...res, loading: false})
    },
    [shouldFetchFullList]
  )

  const {params, query} = useMemo(() => {
    const sort = sortOrder?.by || DEFAULT_ORDERING?.by
    const extendedProjection = sortOrder?.extendedProjection || DEFAULT_ORDERING?.extendedProjection
    const limit = shouldFetchFullList ? FULL_LIST_LIMIT : PARTIAL_PAGE_LIMIT
    const types = typeNames.flatMap((name) => schema.get(name) || []) as SearchableType[]

    const terms: SearchTerms = {
      query: searchQuery || '',
      types,
      filter: isSimpleFilter ? undefined : filter,
    }

    const options: SearchOptions & WeightedSearchOptions = {
      params: paramsProp,
      limit,
      sort,
      extendedProjection,
    }

    return createSearchQuery(terms, options)
  }, [
    filter,
    isSimpleFilter,
    paramsProp,
    schema,
    searchQuery,
    shouldFetchFullList,
    sortOrder?.by,
    sortOrder?.extendedProjection,
    typeNames,
  ])

  const listener$ = useMemo(() => {
    if (typeNames.length === 0) {
      return EMPTY
    }

    return client.observable.listen(
      `*[_type in $types]`,
      {types: typeNames},
      {events: ['welcome', 'mutation']}
    )
  }, [client.observable, typeNames])

  const getQueryResultsProps = useMemo(() => ({client, query, params}), [client, params, query])

  // Set up the document list listener
  useEffect(() => {
    setResult((prev) => ({...prev, loading: true}))

    const queryResults$ = listener$.pipe(
      switchMap(() => {
        return getQueryResults(of(getQueryResultsProps), {
          apiVersion,
          tag: 'desk.document-list',
        })
      })
    )

    const initial$ = of(INITIAL_STATE)
    const state$ = concat(initial$, queryResults$)
    const sub = state$.subscribe(handleSetResult as FIXME)

    return () => {
      sub.unsubscribe()
    }
  }, [apiVersion, getQueryResultsProps, handleSetResult, listener$])

  const reset = useCallback(() => {
    setResult(INITIAL_STATE)
    setHasFullList(false)
    setShouldFetchFullList(false)
    setIsLazyLoading(false)
  }, [])

  useEffect(() => {
    reset()
  }, [reset, filter, paramsProp, sortOrder, searchQuery, typeNames])

  const isSearchReady = isSimpleFilter
    ? typeNames.length > 0
    : typeNames.length > 0 && !loadingDocumentTypes

  return {
    error,
    hasMaxItems,
    isLazyLoading,
    isLoading: isSimpleFilter ? isLoading : Boolean(!isSearchReady || isLoading),
    isSearchReady,
    items,
    onListChange,
    onRetry,
  }
}
