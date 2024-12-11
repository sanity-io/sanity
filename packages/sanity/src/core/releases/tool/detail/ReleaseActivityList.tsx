'use no memo'
// The `use no memo` directive is due to a known issue with react-virtual and react compiler: https://github.com/TanStack/virtual/issues/736

import {Box} from '@sanity/ui'
import {useVirtualizer} from '@tanstack/react-virtual'
import {AnimatePresence} from 'framer-motion'
import {useEffect, useRef} from 'react'
import {styled} from 'styled-components'

import {LoadingBlock} from '../../../components/loadingBlock/LoadingBlock'
import {
  isAddDocumentToReleaseEvent,
  isDiscardDocumentFromReleaseEvent,
  type ReleaseEvent,
} from './activity/types'
import {ReleaseActivityListItem} from './ReleaseActivityListItem'

const estimateSize = (event: ReleaseEvent | undefined) => {
  if (!event) {
    return 40 // Is the loader row
  }
  if (isAddDocumentToReleaseEvent(event) || isDiscardDocumentFromReleaseEvent(event)) {
    return 70
  }
  return 56
}
const VirtualContainer = styled(Box)`
  height: 100%;
  overflow: scroll;
`

interface ReleaseActivityListProps {
  events: ReleaseEvent[]
  releaseTitle: string
  releaseId: string
  hasMore: boolean
  loadMore: () => void
  isLoading: boolean
}
export const ReleaseActivityList = ({
  events,
  releaseTitle,
  releaseId,
  hasMore,
  loadMore,
  isLoading,
}: ReleaseActivityListProps) => {
  const virtualizerContainerRef = useRef<HTMLDivElement | null>(null)

  const virtualizer = useVirtualizer({
    // If we have more events, or the events are loading, we add a loader row at the end
    count: hasMore || isLoading ? events.length + 1 : events.length,
    getScrollElement: () => virtualizerContainerRef.current,
    estimateSize: (i) => estimateSize(events[i]),
    overscan: 10,
    paddingEnd: 24,
  })

  const virtualItems = virtualizer.getVirtualItems()

  useEffect(() => {
    const lastItem = virtualItems.at(-1)
    if (!lastItem) return
    if (lastItem.index >= events.length - 1 && hasMore) {
      loadMore()
    }
  }, [events.length, hasMore, loadMore, virtualItems])
  return (
    <VirtualContainer id="virtualizer-container" ref={virtualizerContainerRef} paddingX={3}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        <AnimatePresence initial={false}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const event = events[virtualRow.index]
            const isLoaderRow = !event

            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {isLoaderRow ? (
                  <Box paddingY={4}>
                    <LoadingBlock fill />
                  </Box>
                ) : (
                  <ReleaseActivityListItem
                    event={event}
                    releaseId={releaseId}
                    releaseTitle={releaseTitle}
                  />
                )}
              </div>
            )
          })}
        </AnimatePresence>
      </div>
    </VirtualContainer>
  )
}
