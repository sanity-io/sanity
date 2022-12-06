import {useMediaIndex} from '@sanity/ui'
import {useVirtualizer} from '@tanstack/react-virtual'
import React, {useMemo, useState} from 'react'
import {useSearchState} from '../../contexts/search/useSearchState'
import {CommandListItem} from '../commandList/CommandListItem'
import {CommandListItems} from '../commandList/CommandListItems'
import {RecentSearchItem} from './item/RecentSearchItem'

interface RecentSearchesVirtualListProps {
  showFiltersOnClick?: boolean
}

// Max character count of selected document types (combined) by breakpoint
const MAX_COMBINED_TYPE_COUNT_SMALL = 20
const MAX_COMBINED_TYPE_COUNT_LARGE = 40

export function RecentSearchesVirtualList({showFiltersOnClick}: RecentSearchesVirtualListProps) {
  const [virtualList, setVirtualListRef] = useState<HTMLDivElement | null>(null)

  const {
    state: {recentSearches},
  } = useSearchState()

  const {getTotalSize, getVirtualItems, measureElement} = useVirtualizer({
    count: recentSearches.length,
    getScrollElement: () => virtualList,
    estimateSize: () => 36,
  })

  const mediaIndex = useMediaIndex()

  const maxVisibleTypePillChars = useMemo(() => {
    return mediaIndex < 2 ? MAX_COMBINED_TYPE_COUNT_SMALL : MAX_COMBINED_TYPE_COUNT_LARGE
  }, [mediaIndex])

  return (
    <CommandListItems
      paddingBottom={1}
      setVirtualListRef={setVirtualListRef}
      totalHeight={getTotalSize()}
    >
      {getVirtualItems().map((virtualRow) => {
        const recentSearch = recentSearches[virtualRow.index]
        return (
          <CommandListItem
            activeIndex={virtualRow.index}
            data-index={virtualRow.index}
            key={virtualRow.key}
            measure={measureElement}
            virtualRow={virtualRow}
          >
            <RecentSearchItem
              index={virtualRow.index}
              maxVisibleTypePillChars={maxVisibleTypePillChars}
              paddingTop={1}
              paddingX={2}
              showFiltersOnClick={showFiltersOnClick}
              value={recentSearch}
            />
          </CommandListItem>
        )
      })}
    </CommandListItems>
  )
}
