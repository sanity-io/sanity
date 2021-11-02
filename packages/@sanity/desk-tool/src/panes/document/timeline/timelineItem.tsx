import React, {useCallback, createElement, useMemo} from 'react'
import {useTimeAgo} from '@sanity/base/hooks'
import {Chunk, ChunkType} from '@sanity/field/diff'
import {Box, Flex, Stack, Text} from '@sanity/ui'
import {formatTimelineEventLabel, getTimelineEventIconComponent} from './helpers'
import {TimelineItemState} from './types'
import {UserAvatarStack} from './userAvatarStack'
import {EventLabel, StyledMenuItem, IconTimelineFlex} from './timelineItem.styled'

export const TimelineItem = React.memo(
  (props: {
    isSelectionBottom: boolean
    isSelectionTop: boolean
    state: TimelineItemState
    onSelect: (chunk: Chunk) => void
    chunk: Chunk
    timestamp: string
    type: ChunkType
    topSelectionIndex: number
    bottomSelectionIndex: number
  }) => {
    const {
      isSelectionBottom,
      isSelectionTop,
      state,
      onSelect,
      timestamp,
      chunk,
      type,
      topSelectionIndex,
      bottomSelectionIndex,
    } = props
    const iconComponent = getTimelineEventIconComponent(type)
    const authorUserIds = Array.from(chunk.authors)
    const timeAgo = useTimeAgo(timestamp, {minimal: true})

    const withinSelection = useMemo(
      () => chunk.index < topSelectionIndex && chunk.index > bottomSelectionIndex,
      [bottomSelectionIndex, chunk.index, topSelectionIndex]
    )

    const eventLabel = useMemo(() => formatTimelineEventLabel(type) || <code>{type}</code>, [type])

    const handleClick = useCallback(
      (evt: React.MouseEvent<HTMLDivElement>) => {
        evt.preventDefault()
        evt.stopPropagation()
        onSelect(chunk)
      },
      [onSelect, chunk]
    )

    return (
      <StyledMenuItem
        data-type={type}
        disabled={state === 'disabled'}
        onClick={handleClick}
        paddingX={2}
        paddingY={0}
        selected={state === 'active'}
        data-active={state === 'active'}
        data-selection-top={isSelectionTop}
        data-selection-bottom={isSelectionBottom}
        data-selection-within={withinSelection || state === 'withinSelection'}
        data-testid="timeline-item"
      >
        <Flex align="center" height="fill" flex={1}>
          <IconTimelineFlex
            align="center"
            paddingX={2}
            data-hidden={state === 'active'}
            data-ui="IconTimelineFlex"
          >
            <Text>{iconComponent && createElement(iconComponent)}</Text>
          </IconTimelineFlex>
          <Stack space={2} paddingY={2} marginLeft={2}>
            <Box>
              <EventLabel size={1} weight="medium">
                {eventLabel}
              </EventLabel>
            </Box>
            <Text size={0} muted>
              {timeAgo}
            </Text>
          </Stack>
          <Flex flex={1} justify="flex-end" align="center">
            <UserAvatarStack maxLength={3} userIds={authorUserIds} />
          </Flex>
        </Flex>
      </StyledMenuItem>
    )
  }
)
