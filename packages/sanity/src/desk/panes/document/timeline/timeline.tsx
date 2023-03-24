import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {Text} from '@sanity/ui'
import {TimelineItem} from './timelineItem'
import {ListWrapper, Root, StackWrapper} from './timeline.styled'
import {Chunk, CommandList, CommandListRenderItemCallback, TimelineController} from 'sanity'

interface TimelineProps {
  controller: TimelineController
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
  bottomSelection,
  controller,
  disabledBeforeSelection,
  onLoadMore,
  onSelect,
  topSelection,
}: TimelineProps) => {
  const [chunks, setChunks] = useState<Chunk[]>(controller.timeline.mapChunks((c) => c))
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    controller.onUpdate = () => {
      setChunks(controller.timeline.mapChunks((c) => c))
      setLoading(false)
      onLoadMore(false)
    }
  }, [controller, disabledBeforeSelection, onLoadMore, topSelection.index])

  const filteredChunks = useMemo(() => {
    return chunks.filter((c) => {
      if (disabledBeforeSelection) {
        return c.index < topSelection.index
      }
      return true
    })
  }, [chunks, disabledBeforeSelection, topSelection.index])

  const selectedIndex = useMemo(
    () => filteredChunks.findIndex((c) => c.id === bottomSelection.id),
    [bottomSelection.id, filteredChunks]
  )

  const handleLoadMore = useCallback(() => {
    if (!loading) {
      setLoading(true)
      onLoadMore(true)
    }
  }, [loading, onLoadMore])

  const renderItem = useCallback<CommandListRenderItemCallback<Chunk>>(
    (chunk, {activeIndex}) => {
      return (
        <TimelineItem
          chunk={chunk}
          isFirst={activeIndex === 0}
          isLast={(filteredChunks && activeIndex === filteredChunks.length - 1) || false}
          isLatest={activeIndex === 0 && !disabledBeforeSelection}
          isSelected={activeIndex === selectedIndex}
          onSelect={onSelect}
          timestamp={chunk.endTimestamp}
          type={chunk.type}
        />
      )
    },
    [disabledBeforeSelection, filteredChunks, onSelect, selectedIndex]
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
            onEndReached={handleLoadMore}
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
