import {Box, Text} from '@sanity/ui'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {
  type Chunk,
  CommandList,
  type CommandListRenderItemCallback,
  LoadingBlock,
  useTranslation,
} from 'sanity'

import {ExpandableTimelineItem} from './expandableTimelineItem'
import {ListWrapper, Root, StackWrapper} from './timeline.styled'
import {TimelineItem} from './timelineItem'
import {collapseChunksOnPublish, isNonPublishChunk, isPublishChunk} from './utils'

interface TimelineProps {
  chunks: Chunk[]
  disabledBeforeFirstChunk?: boolean
  firstChunk?: Chunk | null
  hasMoreChunks: boolean | null
  lastChunk?: Chunk | null
  onLoadMore: () => void
  onSelect: (chunk: Chunk) => void
  /**
   * The list needs a predefined max height for the scroller to work.
   */
  listMaxHeight?: string
}

export const Timeline = ({
  chunks,
  disabledBeforeFirstChunk,
  hasMoreChunks,
  lastChunk: selectedChunk,
  onLoadMore,
  onSelect,
  firstChunk,
  listMaxHeight = 'calc(100vh - 198px)',
}: TimelineProps) => {
  const [mounted, setMounted] = useState(false)
  const {t} = useTranslation('studio')

  const selectedChunkId = selectedChunk?.id
  const filteredChunks = useMemo(() => {
    return collapseChunksOnPublish(
      chunks.filter((c) => {
        if (disabledBeforeFirstChunk && firstChunk) {
          return c.index < firstChunk.index
        }
        return true
      }),
    )
  }, [chunks, disabledBeforeFirstChunk, firstChunk])

  /**
   * The index of the selected chunk in the filtered list, or -1 if not found.
   * It returns the parent index for publish chunks.
   */
  const selectedIndex = useMemo(
    () =>
      selectedChunkId
        ? filteredChunks.findIndex((chunk) => {
            if (isNonPublishChunk(chunk)) {
              return chunk.id === selectedChunkId
            }
            if (isPublishChunk(chunk)) {
              const isParentSelected = chunk.id === selectedChunkId
              if (isParentSelected) return true

              const isChildrenSelected = chunk.squashedChunks?.find(
                (squashed) => squashed.id === selectedChunkId,
              )
              return isChildrenSelected
            }
            return false
          })
        : -1,
    [selectedChunkId, filteredChunks],
  )

  const renderItem = useCallback<CommandListRenderItemCallback<(typeof filteredChunks)[number]>>(
    (chunk, {activeIndex}) => {
      const isFirst = activeIndex === 0

      return (
        <Box paddingBottom={1} paddingTop={isFirst ? 1 : 0} paddingX={1}>
          {isPublishChunk(chunk) ? (
            <ExpandableTimelineItem
              chunk={chunk}
              squashedChunks={chunk.squashedChunks}
              selectedChunkId={selectedChunkId}
              onSelect={onSelect}
            />
          ) : (
            <TimelineItem
              chunk={chunk}
              isSelected={selectedChunkId === chunk.id}
              onSelect={onSelect}
              timestamp={chunk.endTimestamp}
              type={chunk.type}
            />
          )}

          {activeIndex === filteredChunks.length - 1 && hasMoreChunks && <LoadingBlock />}
        </Box>
      )
    },
    [filteredChunks.length, hasMoreChunks, onSelect, selectedChunkId],
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
          <Text size={1} weight="medium">
            {t('timeline.error.no-document-history-title')}
          </Text>
          <Text muted size={1}>
            {t('timeline.error.no-document-history-description')}
          </Text>
        </StackWrapper>
      )}

      {filteredChunks.length > 0 && (
        <ListWrapper direction="column" $maxHeight={listMaxHeight}>
          <CommandList
            activeItemDataAttr="data-hovered"
            ariaLabel={t('timeline.list.aria-label')}
            autoFocus="list"
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
