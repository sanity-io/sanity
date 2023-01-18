import React, {useCallback, createElement, useMemo, useState} from 'react'
import {Box, ButtonTone, Flex, Stack, Text, Tooltip} from '@sanity/ui'
import {format} from 'date-fns'
import {formatTimelineEventLabel, getTimelineEventIconComponent} from './helpers'
import {TimelineItemState} from './types'
import {UserAvatarStack} from './userAvatarStack'

import {EventLabel, IconBox, IconWrapper, Root, TimestampBox} from './timelineItem.styled'
import {ChunkType, Chunk, useTimeAgo} from 'sanity'

const TIMELINE_ITEM_EVENT_TONE: Record<ChunkType | 'withinSelection', ButtonTone> = {
  initial: 'primary',
  create: 'primary',
  publish: 'positive',
  editLive: 'caution',
  editDraft: 'caution',
  unpublish: 'critical',
  discardDraft: 'critical',
  delete: 'critical',
  withinSelection: 'primary',
}

export function TimelineItem(props: {
  isSelectionBottom: boolean
  isSelectionTop: boolean
  state: TimelineItemState
  onSelect: (chunk: Chunk) => void
  chunk: Chunk
  timestamp: string
  type: ChunkType
}) {
  const {isSelectionBottom, isSelectionTop, state, onSelect, timestamp, chunk, type} = props
  const iconComponent = getTimelineEventIconComponent(type)
  const authorUserIds = Array.from(chunk.authors)
  const timeAgo = useTimeAgo(timestamp, {minimal: true})
  const formattedTimestamp = useMemo(() => {
    const parsedDate = new Date(timestamp)
    const formattedDate = format(parsedDate, 'MMM d, yyyy, hh:mm a')

    return formattedDate
  }, [timestamp])

  const isSelected = state === 'selected'
  const isWithinSelection = state === 'withinSelection'

  const [isHovered, setHovered] = useState(false)

  const handleClick = useCallback(
    (evt: React.MouseEvent<HTMLDivElement>) => {
      evt.preventDefault()
      evt.stopPropagation()
      onSelect(chunk)
    },
    [onSelect, chunk]
  )

  // @todo: ensure that tooltips are correctly displayed when navigating the parent <Menu> component with the keyboard.
  return (
    <Root
      data-ui="timelineItem"
      radius={2}
      data-chunk-id={chunk.id}
      padding={0}
      tone={
        isHovered || isSelected || isWithinSelection ? 'default' : TIMELINE_ITEM_EVENT_TONE[type]
      }
      pressed={isWithinSelection}
      state={state}
      selected={isSelected}
      isHovered={isHovered}
      disabled={state === 'disabled'}
      data-selection-bottom={isSelectionBottom}
      data-selection-top={isSelectionTop}
      onClick={handleClick}
    >
      <Tooltip
        portal
        placement="left"
        fallbackPlacements={['bottom']}
        content={
          <Stack padding={3} space={3}>
            <Text size={1}>{formattedTimestamp}</Text>
          </Stack>
        }
      >
        <Box
          // eslint-disable-next-line react/jsx-no-bind
          onMouseEnter={() => setHovered(true)}
          // eslint-disable-next-line react/jsx-no-bind
          onMouseLeave={() => setHovered(false)}
          paddingX={2}
        >
          <Flex align="stretch">
            <IconWrapper align="center">
              <IconBox padding={2}>
                <Text size={2}>{iconComponent && createElement(iconComponent)}</Text>
              </IconBox>
            </IconWrapper>

            <Stack space={2} margin={2}>
              <Box>
                <EventLabel size={1} weight="medium">
                  {formatTimelineEventLabel(type) || <code>{type}</code>}
                </EventLabel>
              </Box>
              <TimestampBox paddingX={1}>
                <Text size={0} muted>
                  {timeAgo}
                </Text>
              </TimestampBox>
            </Stack>
            <Flex flex={1} justify="flex-end" align="center">
              <UserAvatarStack maxLength={3} userIds={authorUserIds} />
            </Flex>
          </Flex>
        </Box>
      </Tooltip>
    </Root>
  )
}
