import {VirtualListChangeOpts} from '@sanity/ui'
import {getQueryResults} from 'part:@sanity/base/query-container'
import {useEffect, useState, useCallback, useMemo, useRef} from 'react'
import {of} from 'rxjs'
import {filter as filterEvents} from 'rxjs/operators'
import {DocumentListPaneItem, QueryResult, SortOrder} from './types'
import {removePublishedWithDrafts, toOrderClause} from './helpers'
import {FULL_LIST_LIMIT, PARTIAL_PAGE_LIMIT} from './constants'

interface UseDocumentListOpts {
  filter: string
  params: Record<string, unknown>
  sortOrder?: SortOrder
  apiVersion?: string
}

interface DocumentListState {
  error: {message: string} | null
  fullList: boolean
  handleListChange: ({toIndex}: VirtualListChangeOpts) => void
  isLoading: boolean
  items: DocumentListPaneItem[] | null
  onRetry?: (event: unknown) => void
}

const DEFAULT_ORDERING: SortOrder = {by: [{field: '_updatedAt', direction: 'desc'}]}

/**
 * @internal
 */
export function useDocumentList(opts: UseDocumentListOpts): DocumentListState {
  const {filter, params, sortOrder, apiVersion} = opts
  const [fullList, setFullList] = useState(false)
  const fullListRef = useRef(fullList)
  const [result, setResult] = useState<QueryResult | null>(null)
  const error = result?.error || null
  const isLoading = result?.loading || result === null
  const onRetry = result?.onRetry
  const documents = result?.result?.documents
  const items = useMemo(() => (documents ? removePublishedWithDrafts(documents) : null), [
    documents,
  ])

  const query = useMemo(() => {
    const extendedProjection = sortOrder?.extendedProjection
    const projectionFields = ['_id', '_type']
    const finalProjection = projectionFields.join(',')
    const sortBy = sortOrder?.by || []
    const limit = fullList ? FULL_LIST_LIMIT : PARTIAL_PAGE_LIMIT
    const sort = sortBy.length > 0 ? sortBy : DEFAULT_ORDERING.by
    const order = toOrderClause(sort)

    if (extendedProjection) {
      const firstProjection = projectionFields.concat(extendedProjection).join(',')
      return [
        `*[${filter}] {${firstProjection}}`,
        `order(${order}) [0...${limit}]`,
        `{${finalProjection}}`,
      ].join('|')
    }

    return `*[${filter}]|order(${order})[0...${limit}]{${finalProjection}}`
  }, [filter, fullList, sortOrder])

  const handleListChange = useCallback(
    ({toIndex}: VirtualListChangeOpts) => {
      if (isLoading || fullListRef.current) {
        return
      }

      if (toIndex >= PARTIAL_PAGE_LIMIT / 2) {
        setFullList(true)

        // Prevent change handler from firing again before setState kicks in
        fullListRef.current = true
      }
    },
    [isLoading]
  )

  // Set up the document list listener
  useEffect(() => {
    // @todo: explain what this does
    const filterFn = fullList
      ? (queryResult: {result: QueryResult | null}) => Boolean(queryResult.result)
      : () => true

    // Set loading state
    setResult((r) => (r ? {...r, loading: true} : null))

    const queryResults$ = getQueryResults(of({query, params}), {
      tag: 'desk.document-list',
      apiVersion,
    }).pipe(filterEvents(filterFn))

    const sub = queryResults$.subscribe(setResult)

    return () => sub.unsubscribe()
  }, [fullList, query, params, apiVersion])

  // If `filter` or `params` changed, set up a new query from scratch.
  // If `sortOrder` changed, set up a new query from scratch as well.
  useEffect(() => {
    setResult(null)
    setFullList(false)
    fullListRef.current = false
  }, [filter, params, sortOrder, apiVersion])

  return {error, fullList, handleListChange, isLoading, items, onRetry}
}
