import {
  type AvatarSize,
  AvatarStack,
  Box,
  Flex,
  Skeleton,
  Stack,
  Text,
  useTheme_v2 as useThemeV2,
} from '@sanity/ui'
import {type ThemeColorAvatarColorKey} from '@sanity/ui/theme'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {useMemo} from 'react'

import {Tooltip} from '../../../../ui-components'
import {UserAvatar} from '../../../components/userAvatar/UserAvatar'
import {useDateTimeFormat} from '../../../hooks/useDateTimeFormat'
import {type RelativeTimeOptions, useRelativeTime} from '../../../hooks/useRelativeTime'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {ReleaseTitle} from '../../../releases/components/ReleaseTitle'
import {VersionInlineBadge} from '../../../releases/components/VersionInlineBadge'
import {isReleaseDocument} from '../../../releases/store/types'
import {getReleaseTone} from '../../../releases/util/getReleaseTone'
import {
  type DocumentGroupEvent,
  isEditDocumentVersionEvent,
  isPublishDocumentVersionEvent,
} from '../../../store/events/types'
import {useUser} from '../../../store/user/hooks'
import {
  TIMELINE_ICON_COMPONENTS,
  TIMELINE_ITEM_EVENT_TONE,
  TIMELINE_ITEM_I18N_KEY_MAPPING,
} from './constants'
import {
  avatarSizeVar,
  avatarSkeleton,
  iconBox,
  iconColorBgVar,
  iconColorFgVar,
  iconSizeVar,
  nameHeightVar,
  nameSkeleton,
} from './Event.css'

interface UserAvatarStackProps {
  maxLength?: number
  userIds: string[]
  size?: AvatarSize
  withTooltip?: boolean
}

function UserAvatarStack({maxLength, userIds, size, withTooltip = true}: UserAvatarStackProps) {
  return (
    <AvatarStack maxLength={maxLength} size={size}>
      {userIds.map((userId) => (
        <UserAvatar key={userId} user={userId} withTooltip={withTooltip} />
      ))}
    </AvatarStack>
  )
}

function IconBox({
  children,
  $color,
  ...restProps
}: {
  children: React.ReactNode
  $color: ThemeColorAvatarColorKey
  align?: 'center'
  justify?: 'center'
}) {
  const theme = useThemeV2()
  const vars = useMemo(
    () =>
      assignInlineVars({
        [iconColorFgVar]: theme.color.avatar[$color].fg,
        [iconColorBgVar]: theme.color.avatar[$color].bg,
        [iconSizeVar]: `${theme.avatar.sizes[0].size}px`,
      }),
    [theme, $color],
  )
  return (
    <Flex className={iconBox} style={vars} {...restProps}>
      {children}
    </Flex>
  )
}

const RELATIVE_TIME_OPTIONS: RelativeTimeOptions = {
  minimal: true,
  useTemporalPhrase: true,
}

function AvatarSkeletonComponent(props: {animated?: boolean}) {
  const theme = useThemeV2()
  const vars = useMemo(
    () =>
      assignInlineVars({
        [avatarSizeVar]: `${theme.avatar.sizes[1].size}px`,
      }),
    [theme],
  )
  return <Skeleton className={avatarSkeleton} style={vars} {...props} />
}

function NameSkeletonComponent(props: {animated?: boolean}) {
  const theme = useThemeV2()
  const vars = useMemo(
    () =>
      assignInlineVars({
        [nameHeightVar]: `${theme.font.text.sizes[0].lineHeight}px`,
      }),
    [theme],
  )
  return <Skeleton className={nameSkeleton} style={vars} {...props} />
}

const UserLine = ({userId}: {userId: string}) => {
  const [user, loading] = useUser(userId)

  return (
    <Flex key={userId} align="center" gap={2} padding={1}>
      <Box>
        {loading || !user ? <AvatarSkeletonComponent animated /> : <UserAvatar user={user} />}
      </Box>
      <Box>
        {loading || !user?.displayName ? (
          <Text size={1}>
            <NameSkeletonComponent animated />
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
const ChangesBy = ({collaborators}: {collaborators: string[]}) => {
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

interface TimelineItemProps {
  event: DocumentGroupEvent
  showChangesBy: 'tooltip' | 'inline' | 'hidden'
}
/**
 * @internal
 */
export function Event({event, showChangesBy = 'tooltip'}: TimelineItemProps) {
  const {t} = useTranslation('studio')
  const {type, timestamp, documentVariantType} = event

  const IconComponent = TIMELINE_ICON_COMPONENTS[type]
  const contributors = 'contributors' in event ? event.contributors || [] : []

  const dateFormat = useDateTimeFormat({dateStyle: 'medium', timeStyle: 'short'})
  const date = new Date(timestamp)

  const updatedTimeAgo = useRelativeTime(date || '', RELATIVE_TIME_OPTIONS)

  const formattedTimestamp = useMemo(() => {
    const parsedDate = new Date(timestamp)
    const formattedDate = dateFormat.format(parsedDate)

    return formattedDate
  }, [timestamp, dateFormat])

  const userIds = isEditDocumentVersionEvent(event) ? event.contributors : [event.author]

  return (
    <>
      <Flex align="center" gap={3}>
        <div style={{position: 'relative'}}>
          <UserAvatarStack maxLength={3} userIds={userIds.filter(Boolean)} size={2} />
          <IconBox align="center" justify="center" $color={TIMELINE_ITEM_EVENT_TONE[type]}>
            <Text size={0}>{IconComponent && <IconComponent />}</Text>
          </IconBox>
        </div>
        <Stack space={2}>
          <Text size={1} weight="medium">
            {t(TIMELINE_ITEM_I18N_KEY_MAPPING[documentVariantType][type])}
            {isPublishDocumentVersionEvent(event) && documentVariantType === 'published' && (
              <>
                {' '}
                {event.release ? (
                  <ReleaseTitle
                    title={event.release.metadata?.title}
                    fallback={t('release.placeholder-untitled-release')}
                  >
                    {({displayTitle}) => (
                      <VersionInlineBadge
                        $tone={
                          isReleaseDocument(event.release!)
                            ? getReleaseTone(event.release)
                            : 'default'
                        }
                      >
                        {displayTitle}
                      </VersionInlineBadge>
                    )}
                  </ReleaseTitle>
                ) : (
                  <VersionInlineBadge $tone="caution">
                    {t('changes.versions.draft')}
                  </VersionInlineBadge>
                )}
              </>
            )}
          </Text>

          <Text as="time" size={1} muted dateTime={timestamp} title={formattedTimestamp}>
            {updatedTimeAgo}
          </Text>
        </Stack>

        {contributors.length > 0 && showChangesBy == 'tooltip' && (
          <Flex flex={1} justify="flex-end" align="center">
            <Tooltip placement="top" content={<ChangesBy collaborators={contributors} />} portal>
              <Box paddingLeft={2} paddingY={2}>
                <UserAvatarStack
                  maxLength={3}
                  userIds={contributors}
                  size={0}
                  withTooltip={false}
                />
              </Box>
            </Tooltip>
          </Flex>
        )}
      </Flex>
      {contributors.length > 0 && showChangesBy === 'inline' && (
        <Box paddingTop={2}>
          <ChangesBy collaborators={contributors} />
        </Box>
      )}
    </>
  )
}
