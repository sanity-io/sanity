import {Card, Skeleton, Stack, Text, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {type ThemeColorAvatarColorKey} from '@sanity/ui/theme'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {type ComponentProps, type MouseEvent, useCallback, useMemo} from 'react'
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
import {Flex, Box} from 'ui5'

import {Tooltip} from '../../../../ui-components/tooltip/Tooltip'
import {getTimelineEventIconComponent} from './helpers'
import {TIMELINE_ITEM_I18N_KEY_MAPPING} from './timelineI18n'
import {
  avatarSize0Var,
  iconBox,
  iconBoxColor,
  nameSkeleton,
  textLineHeight0Var,
} from './timelineItem.css'
import {UserAvatarStack} from './userAvatarStack'
import {type ChunksWithCollapsedDrafts} from './utils'

function IconBox(props: ComponentProps<typeof Flex> & {$color: ThemeColorAvatarColorKey}) {
  const {$color, className, style, ...rest} = props
  const {avatar} = useThemeV2()

  return (
    <Flex
      {...rest}
      className={clsx(iconBox, iconBoxColor[$color], className)}
      style={{...assignInlineVars({[avatarSize0Var]: `${avatar.sizes[0].size}px`}), ...style}}
    />
  )
}

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

function NameSkeleton(props: ComponentProps<typeof Skeleton>) {
  const {className, style, ...rest} = props
  const {font} = useThemeV2()

  return (
    <Skeleton
      {...rest}
      className={clsx(nameSkeleton, className)}
      style={{
        ...assignInlineVars({[textLineHeight0Var]: `${font.text.sizes[0].lineHeight}px`}),
        ...style,
      }}
    />
  )
}

const UserLine = ({userId}: {userId: string}) => {
  const [user, loading] = useUser(userId)

  return (
    <Flex key={userId} alignItems="center" gap={2} padding={1}>
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
    <Flex alignItems="center" gap={1}>
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
        <Flex alignItems="center" gap={3}>
          <div style={{position: 'relative'}}>
            <UserAvatarStack maxLength={3} userIds={authorUserIds} size={2} />
            <IconBox
              alignItems="center"
              justifyContent="center"
              $color={TIMELINE_ITEM_EVENT_TONE[type]}
            >
              {/* oxlint-disable-next-line react/static-components -- this is intentional and how the middleware components has to work */}
              <Text size={0}>{IconComponent && <IconComponent />}</Text>
            </IconBox>
          </div>
          <Stack gap={2}>
            <Text size={1} weight="medium">
              {t(TIMELINE_ITEM_I18N_KEY_MAPPING[type]) || <code>{type}</code>}
            </Text>

            <Text as="time" size={1} muted dateTime={timestamp} title={formattedTimestamp}>
              {updatedTimeAgo}
            </Text>
          </Stack>

          {collaboratorsUsersIds.length > 0 && (
            <Flex flexBasis="0%" flexGrow={1} justifyContent="flex-end" alignItems="center">
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
