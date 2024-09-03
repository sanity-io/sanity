import {Box, Text} from '@sanity/ui'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {
  type Chunk,
  CommandList,
  type CommandListRenderItemCallback,
  LoadingBlock,
  useTranslation,
} from 'sanity'

import {ExpandableTimelineItemMenu} from './expandableTimelineItemMenu'
import {ListWrapper, Root, StackWrapper} from './timeline.styled'
import {TimelineItem} from './timelineItem'
import {addChunksMetadata, isNonPublishChunk, isPublishChunk} from './utils'

interface TimelineProps {
  chunks: Chunk[]

  hasMoreChunks: boolean | null
  lastChunk?: Chunk | null
  onLoadMore: () => void
  onSelect: (chunk: Chunk) => void
  /**
   * The list needs a predefined max height for the scroller to work.
   */
  listMaxHeight?: string
}

export const TIMELINE_LIST_WRAPPER_ID = 'timeline-list-wrapper'

export const Timeline = ({
  chunks,
  hasMoreChunks,
  lastChunk: selectedChunk,
  onLoadMore,
  onSelect,
  listMaxHeight = 'calc(100vh - 280px)',
}: TimelineProps) => {
  const [mounted, setMounted] = useState(false)
  const {t} = useTranslation('studio')
  const selectedChunkId = selectedChunk?.id
  const chunksWithMetadata = useMemo(() => addChunksMetadata(chunks), [chunks])

  const [expandedParents, setExpandedParents] = useState<Set<string>>(() => {
    if (selectedChunkId) {
      const selectedChunkWithParentData = chunksWithMetadata.find(
        (chunk) => chunk.id === selectedChunkId,
      )
      if (
        selectedChunkWithParentData &&
        isNonPublishChunk(selectedChunkWithParentData) &&
        selectedChunkWithParentData.parentId
      ) {
        return new Set([selectedChunkWithParentData.parentId])
      }
    }
    return new Set()
  })

  const filteredChunks = useMemo(() => {
    return chunksWithMetadata.filter((chunk) => {
      if (isPublishChunk(chunk) || !chunk.parentId) return true
      return expandedParents.has(chunk.parentId)
    })
  }, [chunksWithMetadata, expandedParents])

  const handleExpandParent = useCallback(
    (parentId: string) => () =>
      setExpandedParents((prev) => {
        if (prev.has(parentId)) {
          const next = new Set(prev)
          next.delete(parentId)
          return next
        }

        const next = new Set(prev)
        next.add(parentId)
        return next
      }),
    [],
  )

  const selectedIndex = useMemo(
    () =>
      selectedChunkId ? filteredChunks.findIndex((chunk) => chunk.id === selectedChunkId) : -1,
    [selectedChunkId, filteredChunks],
  )

  const renderItem = useCallback<CommandListRenderItemCallback<(typeof filteredChunks)[number]>>(
    (chunk, {activeIndex}) => {
      const isFirst = activeIndex === 0

      return (
        <>
          <Box
            paddingBottom={1}
            paddingTop={isFirst ? 1 : 0}
            paddingRight={1}
            paddingLeft={isNonPublishChunk(chunk) && chunk.parentId ? 4 : 1}
          >
            <TimelineItem
              chunk={chunk}
              isSelected={selectedChunkId === chunk.id}
              onSelect={onSelect}
              collaborators={isPublishChunk(chunk) ? chunk.collaborators : undefined}
              optionsMenu={
                isPublishChunk(chunk) && chunk.children.length > 0 ? (
                  <ExpandableTimelineItemMenu
                    chunkId={chunk.id}
                    isExpanded={expandedParents.has(chunk.id)}
                    onExpand={handleExpandParent(chunk.id)}
                  />
                ) : null
              }
            />
          </Box>
          {activeIndex === filteredChunks.length - 1 && hasMoreChunks && <LoadingBlock />}
        </>
      )
    },
    [
      expandedParents,
      filteredChunks.length,
      handleExpandParent,
      hasMoreChunks,
      onSelect,
      selectedChunkId,
    ],
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
        <ListWrapper direction="column" $maxHeight={listMaxHeight} id={TIMELINE_LIST_WRAPPER_ID}>
          <CommandList
            activeItemDataAttr="data-hovered"
            ariaLabel={t('timeline.list.aria-label')}
            autoFocus="list"
            initialIndex={selectedIndex}
            initialScrollAlign="center"
            itemHeight={57}
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
