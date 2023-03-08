import React, {useCallback} from 'react'
import {CommandListVirtualItemProps, useCommandList} from '../../../../../../components'
import type {WeightedHit} from '../../../../../../search'
import {getPublishedId} from '../../../../../../util/draftUtils'
import {useSearchState} from '../../contexts/search/useSearchState'
import {DebugOverlay} from './item/DebugOverlay'
import {SearchResultItem} from './item/SearchResultItem'

export function SearchResultVirtualItem({value}: CommandListVirtualItemProps<WeightedHit>) {
  const {
    dispatch,
    onClose,
    recentSearchesStore,
    state: {debug, filters, terms},
  } = useSearchState()
  const {getTopIndex} = useCommandList()

  /**
   * Add current search to recent searches, trigger child item click and close search
   */
  const handleSearchResultClick = useCallback(() => {
    if (recentSearchesStore) {
      const updatedRecentSearches = recentSearchesStore.addSearch(terms, filters)
      dispatch({recentSearches: updatedRecentSearches, type: 'RECENT_SEARCHES_SET'})
    }
    dispatch({index: getTopIndex(), type: 'LAST_ACTIVE_INDEX_SET'})
    onClose?.()
  }, [dispatch, filters, getTopIndex, onClose, recentSearchesStore, terms])

  return (
    <>
      <SearchResultItem
        documentId={getPublishedId(value.hit._id) || ''}
        documentType={value.hit._type}
        onClick={handleSearchResultClick}
        paddingTop={2}
        paddingX={2}
      />
      {debug && <DebugOverlay data={value} />}
    </>
  )
}
