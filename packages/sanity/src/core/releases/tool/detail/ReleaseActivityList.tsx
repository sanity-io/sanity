'use no memo'
// The `use no memo` directive is due to a known issue with react-virtual and react compiler: https://github.com/TanStack/virtual/issues/736

import {Box} from '@sanity/ui'
import {useVirtualizer} from '@tanstack/react-virtual'
import {AnimatePresence} from 'framer-motion'
import {useEffect, useMemo, useRef} from 'react'
import {styled} from 'styled-components'

import {LoadingBlock} from '../../../components/loadingBlock/LoadingBlock'
import {
  isAddDocumentToReleaseEvent,
  isDiscardDocumentFromReleaseEvent,
  isEventsAPIEvent,
  isTranslogEvent,
  type ReleaseEvent,
} from './events/types'
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

  const listEvents: ReleaseEvent[] = useMemo(() => {
    /**
     * This list combines:
     * - API events, which are loaded incrementally (paginated)
     * - Translog events, which are fully available (non-paginated)
     *
     * We want to display all events up to the oldest API event and include any translog events
     * that occurred before that API event. By doing so, as we load older batches of API events,
     * they will show at the bottom of the list
     */

    // If all events are loaded (no more pages) and we’re not loading, just return all events.
    if (!hasMore && !isLoading) return events

    const lastEventFromEventsAPI = [...events].reverse().find(isEventsAPIEvent)
    // If no API events are found (e.g., events api is not enabled) and we're not loading, return all translog events.
    if (!lastEventFromEventsAPI && !isLoading) return events

    // If we haven’t found any API events yet and are still loading, show nothing for now.
    if (!lastEventFromEventsAPI) return []

    // Include only those translog events that occur before the newest API event.
    const lastEventDate = new Date(lastEventFromEventsAPI.timestamp)
    return events.filter((event) => {
      if (isTranslogEvent(event)) {
        return new Date(event.timestamp) > lastEventDate
      }
      return true
    })
  }, [events, hasMore, isLoading])

  const virtualizer = useVirtualizer({
    // If we have more events, or the events are loading, we add a loader row at the end
    count: hasMore || isLoading ? listEvents.length + 1 : listEvents.length,
    getScrollElement: () => virtualizerContainerRef.current,
    estimateSize: (i) => estimateSize(events[i]),
    overscan: 10,
    paddingEnd: 24,
  })

  const virtualItems = virtualizer.getVirtualItems()

  useEffect(() => {
    const lastItem = virtualItems.at(-1)
    if (!lastItem) return
    if (lastItem.index >= listEvents.length - 1 && hasMore) {
      loadMore()
    }
  }, [listEvents.length, hasMore, loadMore, virtualItems])

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
            const event = listEvents[virtualRow.index]
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
