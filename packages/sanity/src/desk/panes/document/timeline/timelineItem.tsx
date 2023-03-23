import React, {useCallback, createElement, useMemo} from 'react'
import {Box, ButtonTone, Card, Flex, Label, Stack, Text} from '@sanity/ui'
import {format} from 'date-fns'
import {formatTimelineEventLabel, getTimelineEventIconComponent} from './helpers'
import {UserAvatarStack} from './userAvatarStack'
import {EventLabel, IconBox, IconWrapper, Root, TimestampBox} from './timelineItem.styled'
import {ChunkType, Chunk} from 'sanity'

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

interface TimelineItemProps {
  chunk: Chunk
  isFirst: boolean
  isLast: boolean
  isLatest: boolean
  isSelected: boolean
  onSelect: (chunk: Chunk) => void
  timestamp: string
  type: ChunkType
}

export function TimelineItem({
  chunk,
  isFirst,
  isLast,
  isLatest,
  isSelected,
  onSelect,
  timestamp,
  type,
}: TimelineItemProps) {
  const iconComponent = getTimelineEventIconComponent(type)
  const authorUserIds = Array.from(chunk.authors)
  const formattedTimestamp = useMemo(() => {
    const parsedDate = new Date(timestamp)
    const formattedDate = format(parsedDate, 'MMM d, yyyy, hh:mm a')

    return formattedDate
  }, [timestamp])

  const handleClick = useCallback(
    (evt: React.MouseEvent<HTMLButtonElement>) => {
      evt.preventDefault()
      evt.stopPropagation()
      onSelect(chunk)
    },
    [onSelect, chunk]
  )

  return (
    <Root
      $selected={isSelected}
      data-chunk-id={chunk.id}
      data-first={isFirst ? true : undefined}
      data-last={isLast ? true : undefined}
      data-ui="timelineItem"
      mode={isSelected ? 'default' : 'bleed'}
      onClick={handleClick}
      padding={0}
      radius={2}
      tone={isSelected ? 'primary' : TIMELINE_ITEM_EVENT_TONE[chunk.type]}
    >
      <Box paddingX={2}>
        <Flex align="stretch">
          <IconWrapper align="center">
            <IconBox padding={2}>
              <Text size={2}>{iconComponent && createElement(iconComponent)}</Text>
            </IconBox>
          </IconWrapper>

          <Stack space={2} margin={2}>
            {isLatest && (
              <Flex>
                <Card
                  padding={1}
                  radius={2}
                  shadow={1}
                  tone={isSelected ? 'primary' : TIMELINE_ITEM_EVENT_TONE[chunk.type]}
                >
                  <Label muted size={0}>
                    Latest
                  </Label>
                </Card>
              </Flex>
            )}
            <Box>
              <EventLabel size={1} weight="medium">
                {formatTimelineEventLabel(type) || <code>{type}</code>}
              </EventLabel>
            </Box>
            <TimestampBox paddingX={1}>
              <Text size={0} muted>
                {formattedTimestamp}
              </Text>
            </TimestampBox>
          </Stack>
          <Flex flex={1} justify="flex-end" align="center">
            <UserAvatarStack maxLength={3} userIds={authorUserIds} />
          </Flex>
        </Flex>
      </Box>
    </Root>
  )
}
