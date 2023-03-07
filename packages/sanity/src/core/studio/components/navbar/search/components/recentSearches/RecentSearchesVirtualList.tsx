import {useMediaIndex} from '@sanity/ui'
import React, {useMemo} from 'react'
import {CommandListItems, type CommandListVirtualItemProps} from '../../../../../../components'
import type {RecentSearch} from '../../datastores/recentSearches'
import {RecentSearchItem} from './item/RecentSearchItem'

interface RecentSearchesVirtualListProps {
  showFiltersOnClick?: boolean
}

// Max character count of selected document types (combined) by breakpoint
const MAX_COMBINED_TYPE_COUNT_SMALL = 20
const MAX_COMBINED_TYPE_COUNT_LARGE = 40

export function RecentSearchesVirtualList({showFiltersOnClick}: RecentSearchesVirtualListProps) {
  const mediaIndex = useMediaIndex()

  const maxVisibleTypePillChars = useMemo(() => {
    return mediaIndex < 2 ? MAX_COMBINED_TYPE_COUNT_SMALL : MAX_COMBINED_TYPE_COUNT_LARGE
  }, [mediaIndex])

  const VirtualListItem = useMemo(() => {
    return function VirtualListItemComponent({
      index,
      value,
    }: CommandListVirtualItemProps<RecentSearch>) {
      return (
        <RecentSearchItem
          index={index}
          maxVisibleTypePillChars={maxVisibleTypePillChars}
          paddingTop={1}
          paddingX={2}
          showFiltersOnClick={showFiltersOnClick}
          value={value}
        />
      )
    }
  }, [maxVisibleTypePillChars, showFiltersOnClick])

  return (
    <CommandListItems
      item={VirtualListItem}
      paddingBottom={1}
      virtualizerOptions={{
        estimateSize: () => 36,
      }}
    />
  )
}
