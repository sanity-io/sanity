import {useEffect, useState, useCallback, useMemo, useRef} from 'react'
import {of} from 'rxjs'
import {filter as filterEvents} from 'rxjs/operators'
import {DocumentListPaneItem, QueryResult, SortOrder} from './types'
import {removePublishedWithDrafts, toOrderClause} from './helpers'
import {DEFAULT_ORDERING, FULL_LIST_LIMIT, PARTIAL_PAGE_LIMIT} from './constants'
import {getQueryResults} from './getQueryResults'
import {DEFAULT_STUDIO_CLIENT_OPTIONS, useClient} from 'sanity'

// Todo extract this to a separate file
// Get the count of documents of a given type
function useDocumentTypeCount(type: string) {
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const [{count}, setCount] = useState<{count: number}>({count: 0})

  useEffect(() => {
    const query = `
    {
      'drafts': *[ _type == $type && _id in path("drafts.**") ]._id,
      'published': *[ _type == $type && !(_id in path("drafts.**"))]._id,
    }
    {
      'count': count(published[ !("drafts." + @ in ^.drafts) ] + drafts)
    }`

    const sub = client.observable.fetch(query, {type}).subscribe(setCount)

    return () => sub.unsubscribe()
  }, [client.observable, type])

  return count
}

const INITIAL_STATE: QueryResult = {
  error: null,
  loading: true,
  onRetry: undefined,
  result: {
    documents: [],
  },
}

interface UseDocumentListOpts {
  filter: string
  params: Record<string, unknown>
  sortOrder?: SortOrder
  apiVersion?: string
}

interface DocumentListState {
  error: {message: string} | null
  fullList: boolean
  handleListChange: () => void
  isLoading: boolean
  items: DocumentListPaneItem[]
  onRetry?: (event: unknown) => void
}

/**
 * @internal
 */
export function useDocumentList(opts: UseDocumentListOpts): DocumentListState {
  const {apiVersion, filter, params, sortOrder} = opts
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const [result, setResult] = useState<QueryResult>(INITIAL_STATE)
  const error = result?.error || null
  const isLoading = result?.loading || result === null
  const onRetry = result?.onRetry
  const documents = result?.result?.documents
  const items = useMemo(() => (documents ? removePublishedWithDrafts(documents) : []), [documents])

  const [page, setPage] = useState(1)
  const [disableReachEnd, setDisableReachEnd] = useState(isLoading)
  const count = useDocumentTypeCount(params?.type as string)
  const hasReachedEnd = useMemo(() => items.length === count, [count, items])
  const hasReachedEndTimeOutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const queryRange = useMemo(() => {
    const startRange = 0
    const endRange = page * PARTIAL_PAGE_LIMIT

    return `[${startRange}...${endRange}]`
  }, [page])

  const query = useMemo(() => {
    const extendedProjection = sortOrder?.extendedProjection
    const projectionFields = ['_id', '_type']
    const finalProjection = projectionFields.join(',')
    const sortBy = sortOrder?.by || []
    const sort = sortBy.length > 0 ? sortBy : DEFAULT_ORDERING.by
    const order = toOrderClause(sort)

    if (extendedProjection) {
      const firstProjection = projectionFields.concat(extendedProjection).join(',')
      return [
        `*[${filter}] {${firstProjection}}`,
        `order(${order}) ${queryRange}`,
        `{${finalProjection}}`,
      ].join('|')
    }

    return `*[${filter}]|order(${order})${queryRange}{${finalProjection}}`
  }, [sortOrder?.extendedProjection, sortOrder?.by, filter, queryRange])

  const hasFullList = useMemo(() => items.length >= FULL_LIST_LIMIT, [items])

  const handleListChange = useCallback(() => {
    if (isLoading || disableReachEnd || hasFullList || hasReachedEnd) {
      return
    }

    setDisableReachEnd(true)
    setPage((v) => v + 1)
  }, [disableReachEnd, hasFullList, isLoading, hasReachedEnd])

  // TODO: Improve
  // The reach end can be triggered twice if the user scrolls fast enough
  // This is a workaround to prevent that from happening by disabling the reach end
  // for a short period of time after it has been triggered. This is not ideal, but
  // it works for now. We should look into a better solution.
  useEffect(() => {
    if (hasReachedEndTimeOutRef.current) {
      clearTimeout(hasReachedEndTimeOutRef.current)
    }

    if (disableReachEnd) {
      hasReachedEndTimeOutRef.current = setTimeout(() => {
        setDisableReachEnd(false)
      }, 300)
    }

    return () => {
      if (hasReachedEndTimeOutRef.current) {
        clearTimeout(hasReachedEndTimeOutRef.current)
      }
    }

    // return undefined
  }, [disableReachEnd, isLoading, count])

  // Set up the document list listener
  useEffect(() => {
    // @todo: explain what this does
    // const filterFn = fullList
    //   ? (queryResult: {result: QueryResult | null}) => Boolean(queryResult.result)
    //   : () => true

    // TODO: Do we need to function above or can we just use this?
    const filterFn = (queryResult: {result: QueryResult | null}) => Boolean(queryResult.result)

    // Set loading state
    setResult((r) => (r ? {...r, loading: true} : r))

    const queryResults$ = getQueryResults(of({client, query, params}), {
      apiVersion,
      tag: 'desk.document-list',
    }).pipe(filterEvents(filterFn) as any)

    const sub = queryResults$.subscribe(setResult as any)

    return () => sub.unsubscribe()
  }, [apiVersion, client, query, params])

  // If `filter` or `params` changed, set up a new query from scratch.
  // If `sortOrder` changed, set up a new query from scratch as well.
  useEffect(() => {
    setResult(INITIAL_STATE)
    setPage(1)
  }, [filter, params, sortOrder, apiVersion])

  return {
    error,
    fullList: hasReachedEnd, // TODO: implement this
    handleListChange,
    isLoading,
    items,
    onRetry,
  }
}
