// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import React, {useCallback, useEffect, useRef, useState} from 'react'
import {Chunk} from '@sanity/field/diff'
import {Box, Menu, Stack, Text} from '@sanity/ui'
import Spinner from 'part:@sanity/components/loading/spinner'
import {Timeline as TimelineModel} from '../documentHistory/history/timeline'
import {TimelineItem} from './timelineItem'
import {TimelineItemState} from './types'
import {Root} from './timeline.styled'

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
  const listRef = useRef<HTMLOListElement | null>(null)
  const [loadingElement, setLoadingElement] = useState<HTMLDivElement | null>(null)

  let state: TimelineItemState = disabledBeforeSelection ? 'disabled' : 'enabled'

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

  return (
    <Root ref={rootRef as any} onScroll={checkIfLoadIsNeeded} data-ui="timeline">
      {timeline.chunkCount === 0 && (
        <Stack padding={4} space={3} style={{maxWidth: 200}}>
          <Text weight="bold">No document history</Text>
          <Text muted size={1}>
            When changing the content of the document, the document versions will appear in this
            menu.
          </Text>
        </Stack>
      )}
      <Menu ref={listRef} padding={2} space={0}>
        {timeline.mapChunks((chunk) => {
          const isSelectionTop = topSelection === chunk
          const isSelectionBottom = bottomSelection === chunk

          if (isSelectionTop) {
            state = 'withinSelection'
          }

          if (isSelectionBottom) {
            state = 'selected'
          }

          const item = (
            <TimelineItem
              chunk={chunk}
              isSelectionBottom={isSelectionBottom}
              isSelectionTop={isSelectionTop}
              key={chunk.id}
              state={state}
              onSelect={onSelect}
              type={chunk.type}
              timestamp={chunk.endTimestamp}
            />
          )

          // Flip it back to normal after we've rendered the active one.
          if (state === 'selected') {
            state = 'enabled'
          }

          return item
        })}
      </Menu>

      {!timeline.reachedEarliestEntry && (
        <Box padding={4} ref={setLoadingElement}>
          <Spinner center />
        </Box>
      )}
    </Root>
  )
}

Timeline.displayName = 'Timeline'
