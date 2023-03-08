import {useMediaIndex} from '@sanity/ui'
import React, {useMemo} from 'react'
import {CommandListVirtualItemProps} from '../../../../../../components'
import {RecentSearch} from '../../datastores/recentSearches'
import {RecentSearchItem} from './item/RecentSearchItem'

// Max character count of selected document types (combined) by breakpoint
const MAX_COMBINED_TYPE_COUNT_SMALL = 20
const MAX_COMBINED_TYPE_COUNT_LARGE = 40

export function RecentSearchVirtualItem({
  value,
  virtualIndex,
}: CommandListVirtualItemProps<RecentSearch>) {
  const mediaIndex = useMediaIndex()

  const maxVisibleTypePillChars = useMemo(() => {
    return mediaIndex < 2 ? MAX_COMBINED_TYPE_COUNT_SMALL : MAX_COMBINED_TYPE_COUNT_LARGE
  }, [mediaIndex])

  return (
    <RecentSearchItem
      index={virtualIndex}
      maxVisibleTypePillChars={maxVisibleTypePillChars}
      paddingTop={1}
      paddingX={2}
      value={value}
    />
  )
}
