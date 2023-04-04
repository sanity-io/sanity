import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {Flex, Spinner, Text} from '@sanity/ui'
import {TimelineItem} from './timelineItem'
import {ListWrapper, Root, StackWrapper} from './timeline.styled'
import {Chunk, CommandList, CommandListRenderItemCallback} from 'sanity'

interface TimelineProps {
  chunks: Chunk[]
  disabledBeforeFirstChunk?: boolean
  firstChunk?: Chunk | null
  hasMoreChunks: boolean
  lastChunk?: Chunk | null
  onLoadMore: () => void
  onSelect: (chunk: Chunk) => void
}

export const Timeline = ({
  chunks,
  disabledBeforeFirstChunk,
  hasMoreChunks,
  lastChunk,
  onLoadMore,
  onSelect,
  firstChunk: topSelection,
}: TimelineProps) => {
  const [mounted, setMounted] = useState(false)

  const filteredChunks = useMemo(() => {
    return chunks.filter((c) => {
      if (disabledBeforeFirstChunk && topSelection) {
        return c.index < topSelection.index
      }
      return true
    })
  }, [chunks, disabledBeforeFirstChunk, topSelection])

  const selectedIndex = useMemo(
    () => filteredChunks.findIndex((c) => c.id === lastChunk?.id),
    [lastChunk?.id, filteredChunks]
  )

  const renderItem = useCallback<CommandListRenderItemCallback<Chunk>>(
    (chunk, {activeIndex}) => {
      return (
        <>
          <TimelineItem
            chunk={chunk}
            isFirst={activeIndex === 0}
            isLast={(filteredChunks && activeIndex === filteredChunks.length - 1) || false}
            isLatest={activeIndex === 0 && !disabledBeforeFirstChunk}
            isSelected={activeIndex === selectedIndex}
            onSelect={onSelect}
            timestamp={chunk.endTimestamp}
            type={chunk.type}
          />
          {activeIndex === filteredChunks.length - 1 && hasMoreChunks && (
            <Flex align="center" justify="center" padding={4}>
              <Spinner muted />
            </Flex>
          )}
        </>
      )
    },
    [disabledBeforeFirstChunk, filteredChunks, hasMoreChunks, onSelect, selectedIndex]
  )

  useEffect(() => setMounted(true), [])

  return (
    <Root
      /**
       * We delay initial rendering if `selectedIndex` is present.
       * This is a _temporary_ workaround to allow the virtual <CommandList>
       * to scroll to a specific index prior to being displayed.
       *
       * Without this, there'll be a noticeable 'flash' where the virtual list
       * will render with its child items at the top and then scroll into position.
       */
      $visible={!selectedIndex || mounted}
      data-ui="timeline"
    >
      {filteredChunks.length === 0 && (
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

      {filteredChunks.length > 0 && (
        <ListWrapper direction="column">
          <CommandList
            activeItemDataAttr="data-hovered"
            ariaLabel="Document revisions"
            autoFocus
            initialIndex={selectedIndex}
            initialScrollAlign="center"
            itemHeight={40}
            items={filteredChunks}
            onEndReached={onLoadMore}
            onEndReachedIndexOffset={20}
            overscan={5}
            renderItem={renderItem}
            wrapAround={false}
          />
        </ListWrapper>
      )}
    </Root>
  )
}

Timeline.displayName = 'Timeline'
