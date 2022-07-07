import {getPublishedId} from 'part:@sanity/base/util/draft-utils'
import React, {useCallback, useContext} from 'react'
import {MenuItem} from '@sanity/ui'
import {RouterContext} from 'part:@sanity/base/router'
import {SearchHit} from '../types'
import {SearchItem} from '../SearchItem'

export interface SearchResultItemProps {
  hit: SearchHit
  onClick: () => void
}

export function SearchResultItem(props: SearchResultItemProps) {
  const {hit, onClick} = props
  const {navigateIntent} = useContext(RouterContext)

  const handleResultClick = useCallback(() => {
    onClick()
    navigateIntent('edit', {
      id: getPublishedId(hit.hit._id),
      type: hit.hit._type,
    })
  }, [navigateIntent, hit, onClick])
  return (
    <MenuItem key={hit.hit._id} onClick={handleResultClick} padding={1}>
      <SearchItem
        data={hit}
        key={hit.hit._id}
        padding={2}
        documentId={getPublishedId(hit.hit._id) || ''}
      />
    </MenuItem>
  )
}
