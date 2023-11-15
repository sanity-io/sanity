import React, {useCallback, createElement, useMemo} from 'react'
import {Box, ButtonTone, Card, Flex, Label, Stack, Text} from '@sanity/ui'
import {getTimelineEventIconComponent} from './helpers'
import {UserAvatarStack} from './userAvatarStack'
import {IconBox, IconWrapper, Root, TimestampBox} from './timelineItem.styled'
import {type ChunkType, type Chunk, useTranslation, useIntlDateTimeFormat} from 'sanity'

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
  const {t} = useTranslation('studio')

  const iconComponent = getTimelineEventIconComponent(type)
  const authorUserIds = Array.from(chunk.authors)
  const isSelectable = type !== 'delete'
  const dateFormat = useIntlDateTimeFormat({dateStyle: 'medium', timeStyle: 'short'})
  const formattedTimestamp = useMemo(() => {
    const parsedDate = new Date(timestamp)
    const formattedDate = dateFormat.format(parsedDate)

    return formattedDate
  }, [timestamp, dateFormat])

  const handleClick = useCallback(
    (evt: React.MouseEvent<HTMLButtonElement>) => {
      evt.preventDefault()
      evt.stopPropagation()

      if (isSelectable) {
        onSelect(chunk)
      }
    },
    [onSelect, chunk, isSelectable],
  )

  return (
    <Root
      $selected={isSelected}
      $disabled={!isSelectable}
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
                    {t('timeline.latest')}
                  </Label>
                </Card>
              </Flex>
            )}
            <Box>
              <Text size={1} weight="medium">
                {t(`timeline.${type}`) || <code>{type}</code>}
              </Text>
            </Box>
            <TimestampBox paddingX={1}>
              <Text as="time" size={0} muted dateTime={timestamp}>
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
