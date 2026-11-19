import {useCallback, useMemo} from 'react'

import {useVersionFeed} from '../../inventoryModel/feed/useVersionFeed'
import {useActiveReleases} from '../../releases/store/useActiveReleases'
import {
  buildDocumentLensFilter,
  type DocumentLensRow,
  getVisibleRange,
  toDocumentLensRows,
  type VersionFilters,
  type VersionSort,
} from '../tool/versions/versionRows'

/**
 * The Document lens, ready to render.
 *
 * @internal
 */
export interface DocumentLensFeed {
  /** True until the feed's document list has loaded. */
  loading: boolean
  error: Error | null
  rows: DocumentLensRow[]
  /** How many documents match the filters. */
  documentCount: number
  /** Tells the feed which documents are on screen, so it loads their pages and drops the rest. */
  onVisibleGroupIds: (groupIds: string[]) => void
}

/**
 * Every stored version across documents, live, from the shared version feed: the documents
 * matching the filters, a page at a time around the rows on screen.
 *
 * @internal
 */
export function useDocumentLensFeed({
  type,
  filters,
  sort,
}: {
  type: string | undefined
  filters: VersionFilters
  sort: VersionSort
}): DocumentLensFeed {
  const {byId: releases} = useActiveReleases()
  const {definition, release, state: stateFilter} = filters
  // Keyed on primitives: the feed restarts whenever `params` changes identity.
  const {filter, params} = useMemo(
    () => buildDocumentLensFilter({type, filters: {definition, release, state: stateFilter}}),
    [definition, release, stateFilter, type],
  )
  const {state, index, setVisibleRange} = useVersionFeed({filter, params, releases})

  const groupIds = state.groupIds
  const rows = useMemo(
    () => (groupIds ? toDocumentLensRows({groupIds, index, filters, sort}) : []),
    [filters, groupIds, index, sort],
  )

  const onVisibleGroupIds = useCallback(
    (visible: string[]) => {
      const range = getVisibleRange(groupIds ?? [], visible)
      if (range) setVisibleRange(range)
    },
    [groupIds, setVisibleRange],
  )

  return {
    loading: groupIds === null && !state.error,
    error: state.error,
    rows,
    documentCount: groupIds?.length ?? 0,
    onVisibleGroupIds,
  }
}
