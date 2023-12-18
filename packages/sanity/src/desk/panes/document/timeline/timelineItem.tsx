import React, {useCallback, createElement, useMemo} from 'react'

import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {ButtonProps} from 'sanity/ui-components'

import {getTimelineEventIconComponent} from './helpers'
import {UserAvatarStack} from './userAvatarStack'
import {IconBox, IconWrapper, Root, TimestampBox} from './timelineItem.styled'
import {TIMELINE_ITEM_I18N_KEY_MAPPING} from './timelineI18n'
import {type ChunkType, type Chunk, useTranslation, useDateTimeFormat} from 'sanity'

const TIMELINE_ITEM_EVENT_TONE: Record<ChunkType | 'withinSelection', ButtonProps['tone']> = {
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
  const dateFormat = useDateTimeFormat({dateStyle: 'medium', timeStyle: 'short'})
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
                  <Text muted size={0} weight="medium">
                    {t('timeline.latest')}
                  </Text>
                </Card>
              </Flex>
            )}
            <Box>
              <Text size={1} weight="medium">
                {t(TIMELINE_ITEM_I18N_KEY_MAPPING[type]) || <code>{type}</code>}
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
