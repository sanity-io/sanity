'use no memo'
// The `use no memo` directive is due to a known issue with react-virtual and react compiler: https://github.com/TanStack/virtual/issues/736

import {Box} from '@sanity/ui'
import {useVirtualizer} from '@tanstack/react-virtual'
import {AnimatePresence} from 'framer-motion'
import {useRef} from 'react'
import {styled} from 'styled-components'

import {
  isAddDocumentToReleaseEvent,
  isDiscardDocumentFromReleaseEvent,
  type ReleaseEvent,
} from './activity/types'
import {ReleaseActivityListItem} from './ReleaseActivityListItem'

const estimateSize = (event: ReleaseEvent) => {
  if (isAddDocumentToReleaseEvent(event) || isDiscardDocumentFromReleaseEvent(event)) {
    return 70
  }
  return 56
}
const VirtualContainer = styled(Box)`
  height: 100%;
  overflow: scroll;
`
export const ReleaseActivityList = ({
  events,
  releaseTitle,
  releaseId,
}: {
  events: ReleaseEvent[]
  releaseTitle: string
  releaseId: string
}) => {
  const virtualizerContainerRef = useRef<HTMLDivElement | null>(null)

  const virtualizer = useVirtualizer({
    count: events.length,
    getScrollElement: () => virtualizerContainerRef.current,
    estimateSize: (i) => estimateSize(events[i]),
    overscan: 10,
    paddingEnd: 50,
  })

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
                <ReleaseActivityListItem
                  event={event}
                  releaseId={releaseId}
                  releaseTitle={releaseTitle}
                />
              </div>
            )
          })}
        </AnimatePresence>
      </div>
    </VirtualContainer>
  )
}
