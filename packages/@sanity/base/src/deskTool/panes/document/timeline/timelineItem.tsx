import React, {useCallback, createElement, useState} from 'react'
import {Box, Flex, Stack, Text, ButtonTone} from '@sanity/ui'
import {ChunkType, Chunk} from '../../../../field'
import {useTimeAgo} from '../../../../hooks'
import {formatTimelineEventLabel, getTimelineEventIconComponent} from './helpers'
import {TimelineItemState} from './types'
import {UserAvatarStack} from './userAvatarStack'

import {EventLabel, IconBox, IconWrapper, Root} from './timelineItem.styled'

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

  return (
    <Root
      data-ui="timelineItem"
      radius={2}
      data-chunk-id={chunk.id}
      paddingY={0}
      paddingX={2}
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
      <div
        // eslint-disable-next-line react/jsx-no-bind
        onMouseEnter={() => setHovered(true)}
        // eslint-disable-next-line react/jsx-no-bind
        onMouseLeave={() => setHovered(false)}
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
            <Text size={0} muted>
              {timeAgo}
            </Text>
          </Stack>
          <Flex flex={1} justify="flex-end" align="center">
            <UserAvatarStack maxLength={3} userIds={authorUserIds} />
          </Flex>
        </Flex>
      </div>
    </Root>
  )
}
