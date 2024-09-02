/* eslint-disable camelcase */
import {Card, Flex, Menu, Stack, Text} from '@sanity/ui'
import {getTheme_v2, type ThemeColorAvatarColorKey} from '@sanity/ui/theme'
import {createElement, type MouseEvent, useCallback, useMemo} from 'react'
import {
  type Chunk,
  type ChunkType,
  ContextMenuButton,
  type RelativeTimeOptions,
  useDateTimeFormat,
  useRelativeTime,
  useTranslation,
} from 'sanity'
import {css, styled} from 'styled-components'

import {MenuButton, MenuItem} from '../../../../ui-components'
import {structureLocaleNamespace} from '../../../i18n'
import {getTimelineEventIconComponent} from './helpers'
import {TIMELINE_ITEM_I18N_KEY_MAPPING} from './timelineI18n'
import {UserAvatarStack} from './userAvatarStack'

export const IconBox = styled(Flex)<{$color: ThemeColorAvatarColorKey}>((props) => {
  const theme = getTheme_v2(props.theme)
  const color = props.$color

  return css`
    --card-icon-color: ${theme.color.avatar[color].fg};
    background-color: ${theme.color.avatar[color].bg};
    box-shadow: 0 0 0 1px var(--card-bg-color);

    position: absolute;
    width: ${theme.avatar.sizes[0].size}px;
    height: ${theme.avatar.sizes[0].size}px;
    right: -3px;
    bottom: -3px;
    border-radius: 50%;
  `
})

const TIMELINE_ITEM_EVENT_TONE: Record<ChunkType | 'withinSelection', ThemeColorAvatarColorKey> = {
  initial: 'blue',
  create: 'blue',
  publish: 'green',
  editLive: 'green',
  editDraft: 'yellow',
  unpublish: 'orange',
  discardDraft: 'orange',
  delete: 'red',
  withinSelection: 'magenta',
}

function TimelineItemMenu({chunk}: {chunk: Chunk}) {
  const {t} = useTranslation(structureLocaleNamespace)
  return (
    <MenuButton
      id={`timeline-item-menu-button-${chunk.id}`}
      button={
        <ContextMenuButton
          aria-label={t('timeline-item.menu-button.aria-label')}
          size="large"
          tooltipProps={{content: t('timeline-item.menu-button.tooltip')}}
        />
      }
      menu={
        <Menu padding={1}>
          <MenuItem text={t('timeline-item.menu.action-expand')} />
        </Menu>
      }
    />
  )
}
export interface TimelineItemProps {
  chunk: Chunk
  isSelected: boolean
  onSelect: (chunk: Chunk) => void
  timestamp: string
  type: ChunkType
  /**
   * Chunks that are squashed together on publish.
   * e.g. all the draft mutations are squashed into a single `publish` chunk when the document is published.
   */
  squashedChunks?: Chunk[]
}

const RELATIVE_TIME_OPTIONS: RelativeTimeOptions = {
  minimal: true,
  useTemporalPhrase: true,
}

export function TimelineItem({
  chunk,
  isSelected,
  onSelect,
  timestamp,
  type,
  squashedChunks,
}: TimelineItemProps) {
  const {t} = useTranslation('studio')

  const iconComponent = getTimelineEventIconComponent(type)
  const authorUserIds = Array.from(chunk.authors)

  // TODO: This will be part of future changes where we will show the history squashed when published
  const collaborators = Array.from(
    new Set(squashedChunks?.flatMap((c) => Array.from(c.authors)) || []),
  ).filter((id) => !authorUserIds.includes(id))

  const isSelectable = type !== 'delete'
  const dateFormat = useDateTimeFormat({dateStyle: 'medium', timeStyle: 'short'})
  const date = new Date(timestamp)

  const updatedTimeAgo = useRelativeTime(date || '', RELATIVE_TIME_OPTIONS)

  const formattedTimestamp = useMemo(() => {
    const parsedDate = new Date(timestamp)
    const formattedDate = dateFormat.format(parsedDate)

    return formattedDate
  }, [timestamp, dateFormat])

  const handleClick = useCallback(
    (evt: MouseEvent<HTMLDivElement>) => {
      evt.preventDefault()
      evt.stopPropagation()

      if (isSelectable) {
        onSelect(chunk)
      }
    },
    [onSelect, chunk, isSelectable],
  )

  return (
    <Flex align="center" gap={1}>
      <Card
        as="button"
        onClick={handleClick}
        padding={2}
        pressed={isSelected}
        radius={2}
        data-ui="timelineItem"
        data-testid="timeline-item-button"
        data-chunk-id={chunk.id}
      >
        <Flex align="center" gap={3}>
          <div style={{position: 'relative'}}>
            <UserAvatarStack maxLength={3} userIds={authorUserIds} size={2} />
            <IconBox align="center" justify="center" $color={TIMELINE_ITEM_EVENT_TONE[type]}>
              <Text size={0}>{iconComponent && createElement(iconComponent)}</Text>
            </IconBox>
          </div>
          <Stack space={2}>
            <Text size={1} weight="medium">
              {t(TIMELINE_ITEM_I18N_KEY_MAPPING[type]) || <code>{type}</code>}
            </Text>

            <Text as="time" size={1} muted dateTime={timestamp} title={formattedTimestamp}>
              {updatedTimeAgo}
            </Text>
          </Stack>

          {collaborators.length > 0 && (
            <Flex flex={1} justify="flex-end" align="center">
              <UserAvatarStack maxLength={3} userIds={collaborators} size={0} />
            </Flex>
          )}
        </Flex>
      </Card>
      {squashedChunks && squashedChunks?.length > 1 ? <TimelineItemMenu chunk={chunk} /> : null}
    </Flex>
  )
}
