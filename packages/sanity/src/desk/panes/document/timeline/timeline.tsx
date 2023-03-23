import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {Text, Spinner, Flex} from '@sanity/ui'
import {TimelineItem} from './timelineItem'
import {Root, StackWrapper, MenuWrapper} from './timeline.styled'
import {TimelineItemState} from './types'
import {Chunk, Timeline as TimelineModel} from 'sanity'

interface TimelineProps {
  timeline: TimelineModel
  onSelect: (chunk: Chunk) => void
  onLoadMore: (state: boolean) => void

  /** Are the chunks above the topSelection enabled? */
  disabledBeforeSelection?: boolean
  /** The first chunk of the selection. */
  topSelection: Chunk
  /** The final chunk of the selection. */
  bottomSelection: Chunk
}

// Must be a positive number
const LOAD_MORE_OFFSET = 20

export const Timeline = ({
  timeline,
  disabledBeforeSelection,
  topSelection,
  bottomSelection,
  onSelect,
  onLoadMore,
}: TimelineProps) => {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const [loadingElement, setLoadingElement] = useState<HTMLDivElement | null>(null)

  const checkIfLoadIsNeeded = useCallback(() => {
    const rootEl = rootRef.current

    if (loadingElement && rootEl) {
      const {offsetHeight, scrollTop} = rootEl
      const bottomPosition = offsetHeight + scrollTop + LOAD_MORE_OFFSET
      const isVisible = loadingElement.offsetTop < bottomPosition

      if (isVisible) {
        // @todo: find out why, for some reason, it won't load without RAF wrapper
        requestAnimationFrame(() => onLoadMore(isVisible))
      }
    }
  }, [onLoadMore, loadingElement])

  // Load whenever it's needed
  useEffect(checkIfLoadIsNeeded, [checkIfLoadIsNeeded])

  // Filter out any disabled chunks
  const filteredChunks = useMemo(() => {
    return timeline
      .mapChunks((c) => c)
      .filter((c) => {
        if (disabledBeforeSelection) {
          return c.index < topSelection.index
        }
        return true
      })
  }, [disabledBeforeSelection, timeline, topSelection])

  return (
    <Root ref={rootRef as any} onScroll={checkIfLoadIsNeeded} data-ui="timeline">
      {timeline.chunkCount === 0 && (
        <StackWrapper padding={3} space={3}>
          <Text size={1} weight="semibold">
            No document history
          </Text>
          <Text muted size={1}>
            When changing the content of the document, the document versions will appear in this
            menu.
          </Text>
        </StackWrapper>
      )}

      <MenuWrapper ref={listRef} padding={1} space={0}>
        {filteredChunks.map((chunk, index) => {
          const bottomIndex = filteredChunks.findIndex((c) => c.id === bottomSelection.id)
          const state: TimelineItemState = index === bottomIndex ? 'selected' : 'enabled'
          return (
            <TimelineItem
              chunk={chunk}
              isLatest={index === 0 && !disabledBeforeSelection}
              onSelect={onSelect}
              key={chunk.id}
              state={state}
              timestamp={chunk.endTimestamp}
              type={chunk.type}
            />
          )
        })}
      </MenuWrapper>

      {!timeline.reachedEarliestEntry && (
        <Flex align="center" justify="center" padding={4} ref={setLoadingElement}>
          <Spinner muted />
        </Flex>
      )}
    </Root>
  )
}

Timeline.displayName = 'Timeline'
