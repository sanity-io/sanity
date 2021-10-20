import React, {useCallback, useEffect, useRef, useState} from 'react'
import {Chunk} from '@sanity/field/diff'
import {Text, Spinner, Flex} from '@sanity/ui'
import {Timeline as TimelineModel} from '../documentHistory/history/Timeline'
import {TimelineItem} from './timelineItem'
import {TimelineItemState} from './types'
import {Root, StackWrapper, MenuWrapper, TimelineVirtualList} from './timeline.styled'
import {useObserveElement} from './helpers'

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

export const Timeline = ({
  timeline,
  disabledBeforeSelection,
  topSelection,
  bottomSelection,
  onSelect,
  onLoadMore,
}: TimelineProps) => {
  const [listElement, setListElement] = useState<HTMLDivElement | null>(null)
  const [loadingElement, setLoadingElement] = useState<HTMLDivElement | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)
  const state = useRef<TimelineItemState>(disabledBeforeSelection ? 'disabled' : 'enabled')

  const handleLoadMore = useCallback(
    (entry) => {
      if (entry[0]?.isIntersecting && !isLoadingMore) {
        onLoadMore(true)
        setIsLoadingMore(true)
      }
    },
    [isLoadingMore, onLoadMore]
  )

  // Load more data when the loadingElement is visible (when you have scrolled to the bottom)
  useObserveElement({
    element: loadingElement,
    options: {root: listElement},
    callback: handleLoadMore,
  })

  useEffect(() => {
    setIsLoadingMore(false)
  }, [timeline])

  const renderItem = useCallback(
    (chunk: Chunk) => {
      const isSelectionTop = topSelection === chunk
      const isSelectionBottom = bottomSelection === chunk

      if (isSelectionTop) {
        state.current = 'withinSelection'
      }

      if (isSelectionBottom) {
        state.current = 'active'
      }

      const item = (
        <TimelineItem
          chunk={chunk}
          isSelectionBottom={isSelectionBottom}
          isSelectionTop={isSelectionTop}
          key={chunk.id}
          state={state.current}
          onSelect={onSelect}
          type={chunk.type}
          timestamp={chunk.endTimestamp}
        />
      )

      // Flip it back to normal after we've rendered the active one.
      if (state.current === 'active') {
        state.current = 'enabled'
      }

      return item
    },
    [bottomSelection, onSelect, topSelection]
  )

  return (
    <Root data-ui="Timeline">
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
        <MenuWrapper ref={setListElement} padding={1} space={0}>
          <TimelineVirtualList
            items={timeline.mapChunks((chunk) => chunk)}
            renderItem={renderItem}
          />

          {!timeline.reachedEarliestEntry && (
            <Flex align="center" justify="center" padding={4} ref={setLoadingElement}>
              <Spinner muted />
            </Flex>
          )}
        </MenuWrapper>
      )}
    </Root>
  )
}
