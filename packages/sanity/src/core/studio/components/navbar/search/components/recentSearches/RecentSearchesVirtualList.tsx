import {useMediaIndex} from '@sanity/ui'
import React, {useMemo} from 'react'
import {CommandListItems} from '../../../../../../components'
import {useSearchState} from '../../contexts/search/useSearchState'
import {RecentSearchItem} from './item/RecentSearchItem'

interface RecentSearchesVirtualListProps {
  showFiltersOnClick?: boolean
}

// Max character count of selected document types (combined) by breakpoint
const MAX_COMBINED_TYPE_COUNT_SMALL = 20
const MAX_COMBINED_TYPE_COUNT_LARGE = 40

export function RecentSearchesVirtualList({showFiltersOnClick}: RecentSearchesVirtualListProps) {
  const {
    state: {recentSearches},
  } = useSearchState()

  const mediaIndex = useMediaIndex()

  const maxVisibleTypePillChars = useMemo(() => {
    return mediaIndex < 2 ? MAX_COMBINED_TYPE_COUNT_SMALL : MAX_COMBINED_TYPE_COUNT_LARGE
  }, [mediaIndex])

  const VirtualListItem = useMemo(() => {
    return function VirtualListItemComponent({index}: {index: number}) {
      const recentSearch = recentSearches[index]
      return (
        <RecentSearchItem
          index={index}
          maxVisibleTypePillChars={maxVisibleTypePillChars}
          paddingTop={1}
          paddingX={2}
          showFiltersOnClick={showFiltersOnClick}
          value={recentSearch}
        />
      )
    }
  }, [maxVisibleTypePillChars, recentSearches, showFiltersOnClick])

  return (
    <CommandListItems
      fixedHeight
      item={VirtualListItem}
      paddingBottom={1}
      virtualizerOptions={{
        estimateSize: () => 36,
      }}
    />
  )
}
