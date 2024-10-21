import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {createElement, type MouseEvent, useCallback, useMemo} from 'react'
import {type Chunk, useDateTimeFormat, useTranslation} from 'sanity'

import {TIMELINE_ICON_COMPONENTS, TIMELINE_ITEM_EVENT_TONE} from './constants'
import {TIMELINE_ITEM_I18N_KEY_MAPPING} from './timelineI18n'
import {IconBox, IconWrapper, Root, TimestampBox} from './timelineItem.styled'
import {UserAvatarStack} from './userAvatarStack'

interface TimelineItemProps {
  chunk: Chunk
  isFirst: boolean
  isLast: boolean
  isLatest: boolean
  isSelected: boolean
  onSelect: (chunk: Chunk) => void
  timestamp: string
}

export function TimelineItem({
  chunk,
  isFirst,
  isLast,
  isLatest,
  isSelected,
  onSelect,
  timestamp,
}: TimelineItemProps) {
  const type = chunk.event.type
  const {t} = useTranslation('studio')

  const iconComponent = TIMELINE_ICON_COMPONENTS[type]

  const authorUserIds = useMemo(() => {
    if (chunk.event.type === 'document.editVersion' && chunk.event.mergedEvents) {
      return Array.from(
        new Set([chunk.event.author, ...chunk.event.mergedEvents.map((event) => event.author)]),
      )
    }
    return [chunk.event.author]
  }, [chunk])

  const isSelectable = type !== 'document.deleteGroup' && type !== 'document.deleteVersion'
  const dateFormat = useDateTimeFormat({dateStyle: 'medium', timeStyle: 'short'})
  const formattedTimestamp = useMemo(() => {
    const parsedDate = new Date(timestamp)
    const formattedDate = dateFormat.format(parsedDate)

    return formattedDate
  }, [timestamp, dateFormat])

  const handleClick = useCallback(
    (evt: MouseEvent<HTMLButtonElement>) => {
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
      data-testid="timeline-item-button"
      data-chunk-id={chunk.id}
      data-first={isFirst ? true : undefined}
      data-last={isLast ? true : undefined}
      data-ui="timelineItem"
      mode={isSelected ? 'default' : 'bleed'}
      onClick={handleClick}
      padding={0}
      radius={2}
      tone={isSelected ? 'primary' : TIMELINE_ITEM_EVENT_TONE[type]}
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
                  tone={isSelected ? 'primary' : TIMELINE_ITEM_EVENT_TONE[chunk.event.type]}
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
