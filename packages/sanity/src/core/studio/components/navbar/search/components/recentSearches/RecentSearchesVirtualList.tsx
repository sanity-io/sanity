import {useMediaIndex} from '@sanity/ui'
import {useVirtualizer} from '@tanstack/react-virtual'
import React, {Dispatch, SetStateAction, useMemo, useState} from 'react'
import {useSearchState} from '../../contexts/search/useSearchState'
import {CommandListItems} from '../common/CommandListItems'
import {RecentSearchItem} from './item/RecentSearchItem'

interface RecentSearchesVirtualListProps {
  setChildContainerRef: Dispatch<SetStateAction<HTMLDivElement | null>>
  setPointerOverlayRef: Dispatch<SetStateAction<HTMLDivElement | null>>
  showFiltersOnClick?: boolean
}

// Max character count of selected document types (combined) by breakpoint
const MAX_COMBINED_TYPE_COUNT_SMALL = 20
const MAX_COMBINED_TYPE_COUNT_LARGE = 40

export function RecentSearchesVirtualList({
  setChildContainerRef,
  setPointerOverlayRef,
  showFiltersOnClick,
}: RecentSearchesVirtualListProps) {
  const [virtualList, setVirtualListRef] = useState<HTMLDivElement | null>(null)

  const {
    state: {recentSearches},
  } = useSearchState()

  const {getTotalSize, getVirtualItems, measureElement} = useVirtualizer({
    count: recentSearches.length,
    enableSmoothScroll: false,
    getScrollElement: () => virtualList,
    estimateSize: () => 36,
  })

  const mediaIndex = useMediaIndex()

  const maxVisibleTypePillChars = useMemo(() => {
    return mediaIndex < 2 ? MAX_COMBINED_TYPE_COUNT_SMALL : MAX_COMBINED_TYPE_COUNT_LARGE
  }, [mediaIndex])

  return (
    <CommandListItems
      setChildContainerRef={setChildContainerRef}
      setPointerOverlayRef={setPointerOverlayRef}
      setVirtualListRef={setVirtualListRef}
      totalHeight={getTotalSize()}
    >
      {getVirtualItems().map((virtualRow) => {
        const recentSearch = recentSearches[virtualRow.index]
        return (
          <div
            data-index={virtualRow.index}
            key={virtualRow.key}
            ref={measureElement}
            // Kept inline to prevent styled-components from generating loads of classes on virtual list scroll
            style={{
              flex: 1,
              left: 0,
              position: 'absolute',
              top: 0,
              transform: `translateY(${virtualRow.start}px)`,
              width: '100%',
            }}
          >
            <RecentSearchItem
              index={virtualRow.index}
              marginTop={1}
              marginX={1}
              maxVisibleTypePillChars={maxVisibleTypePillChars}
              showFiltersOnClick={showFiltersOnClick}
              value={recentSearch}
            />
          </div>
        )
      })}
    </CommandListItems>
  )
}
