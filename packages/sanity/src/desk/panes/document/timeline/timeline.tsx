import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {Box, Flex, Spinner, Text} from '@sanity/ui'
import {TimelineItem} from './timelineItem'
import {ListWrapper, StackWrapper} from './timeline.styled'
import {Chunk, CommandList, CommandListRenderItemCallback, Timeline as TimelineModel} from 'sanity'

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
  bottomSelection,
  disabledBeforeSelection,
  onLoadMore,
  onSelect,
  timeline,
  topSelection,
}: TimelineProps) => {
  const rootRef = useRef<HTMLDivElement | null>(null)
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

  const selectedIndex = useMemo(
    () => filteredChunks.findIndex((c) => c.id === bottomSelection.id),
    [bottomSelection.id, filteredChunks]
  )

  const renderItem = useCallback<CommandListRenderItemCallback<Chunk>>(
    (chunk, {activeIndex}) => {
      return (
        <TimelineItem
          chunk={chunk}
          isFirst={activeIndex === 0}
          isLast={activeIndex === filteredChunks.length - 1}
          isLatest={activeIndex === 0 && !disabledBeforeSelection}
          isSelected={activeIndex === selectedIndex}
          onSelect={onSelect}
          timestamp={chunk.endTimestamp}
          type={chunk.type}
        />
      )
    },
    [disabledBeforeSelection, filteredChunks.length, onSelect, selectedIndex]
  )

  return (
    <Box ref={rootRef as any} onScroll={checkIfLoadIsNeeded} data-ui="timeline">
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

      {timeline.chunkCount > 0 && (
        <ListWrapper direction="column">
          <CommandList
            activeItemDataAttr="data-hovered"
            ariaLabel="Children"
            autoFocus
            initialIndex={selectedIndex}
            initialScrollAlign="center"
            itemHeight={40}
            items={filteredChunks}
            // onEndReached={handleLoadMore}
            // onEndReachedIndexOffset={10}
            overscan={10}
            renderItem={renderItem}
          />
        </ListWrapper>
      )}

      {!timeline.reachedEarliestEntry && (
        <Flex align="center" justify="center" padding={4} ref={setLoadingElement}>
          <Spinner muted />
        </Flex>
      )}
    </Box>
  )
}

Timeline.displayName = 'Timeline'
