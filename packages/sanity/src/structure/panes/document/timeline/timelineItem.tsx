import {Box, Card, Flex, Skeleton, Stack, Text} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2, type ThemeColorAvatarColorKey} from '@sanity/ui/theme'
import {type MouseEvent, useCallback, useMemo} from 'react'
import {
  AvatarSkeleton,
  type ChunkType,
  type RelativeTimeOptions,
  useDateTimeFormat,
  UserAvatar,
  useRelativeTime,
  useTranslation,
  useUser,
} from 'sanity'
import {css, styled} from 'styled-components'

import {Tooltip} from '../../../../ui-components'
import {getTimelineEventIconComponent} from './helpers'
import {TIMELINE_ITEM_I18N_KEY_MAPPING} from './timelineI18n'
import {UserAvatarStack} from './userAvatarStack'
import {type ChunksWithCollapsedDrafts} from './utils'

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

export interface TimelineItemProps {
  chunk: ChunksWithCollapsedDrafts
  isSelected: boolean
  onSelect: (chunk: ChunksWithCollapsedDrafts) => void
  collaborators?: Set<string>
  optionsMenu?: React.ReactNode
}

const RELATIVE_TIME_OPTIONS: RelativeTimeOptions = {
  minimal: true,
  useTemporalPhrase: true,
}

const NameSkeleton = styled(Skeleton)((props) => {
  const theme = getTheme_v2(props.theme)
  return css`
    width: 6ch;
    height: ${theme.font.text.sizes[0].lineHeight}px;
  `
})

const UserLine = ({userId}: {userId: string}) => {
  const [user, loading] = useUser(userId)

  return (
    <Flex align="center" gap={2} key={userId} padding={1}>
      <Box>{loading || !user ? <AvatarSkeleton animated /> : <UserAvatar user={user} />}</Box>
      <Box>
        {loading || !user?.displayName ? (
          <Text size={1}>
            <NameSkeleton animated />
          </Text>
        ) : (
          <Text muted size={1}>
            {user.displayName}
          </Text>
        )}
      </Box>
    </Flex>
  )
}
const TooltipContent = ({collaborators}: {collaborators: string[]}) => {
  const {t} = useTranslation('studio')
  return (
    <Stack paddingBottom={1}>
      <Box padding={1} paddingBottom={2}>
        <Text size={1} weight="medium">
          {t('timeline.changes.title')}
        </Text>
      </Box>
      {collaborators.map((userId) => (
        <UserLine key={userId} userId={userId} />
      ))}
    </Stack>
  )
}
export function TimelineItem({
  chunk,
  isSelected,
  onSelect,
  collaborators,
  optionsMenu,
}: TimelineItemProps) {
  const {t} = useTranslation('studio')
  const {type, endTimestamp: timestamp} = chunk
  const IconComponent = getTimelineEventIconComponent(type)
  const authorUserIds = Array.from(chunk.authors)
  const collaboratorsUsersIds = collaborators ? Array.from(collaborators) : []
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
              <Text size={0}>{IconComponent && <IconComponent />}</Text>
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

          {collaboratorsUsersIds.length > 0 && (
            <Flex flex={1} justify="flex-end" align="center">
              <Tooltip
                placement="top"
                content={<TooltipContent collaborators={collaboratorsUsersIds} />}
                portal
              >
                <Box paddingLeft={2} paddingY={2}>
                  <UserAvatarStack
                    maxLength={3}
                    userIds={collaboratorsUsersIds}
                    size={0}
                    withTooltip={false}
                  />
                </Box>
              </Tooltip>
            </Flex>
          )}
        </Flex>
      </Card>
      {optionsMenu}
    </Flex>
  )
}
