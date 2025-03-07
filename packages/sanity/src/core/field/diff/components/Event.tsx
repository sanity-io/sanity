import {type AvatarSize, AvatarStack, Box, Flex, Skeleton, Stack, Text} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2, type ThemeColorAvatarColorKey} from '@sanity/ui/theme'
import {useMemo} from 'react'
import {css, styled} from 'styled-components'

import {Tooltip} from '../../../../ui-components'
import {UserAvatar} from '../../../components/userAvatar/UserAvatar'
import {useDateTimeFormat} from '../../../hooks/useDateTimeFormat'
import {type RelativeTimeOptions, useRelativeTime} from '../../../hooks/useRelativeTime'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {VersionInlineBadge} from '../../../releases/components/VersionInlineBadge'
import {getReleaseTone} from '../../../releases/util/getReleaseTone'
import {
  type DocumentGroupEvent,
  isEditDocumentVersionEvent,
  isPublishDocumentVersionEvent,
} from '../../../store/events/types'
import {useUser} from '../../../store/user/hooks'
import {getDocumentVariantType} from '../../../util/getDocumentVariantType'
import {
  TIMELINE_ICON_COMPONENTS,
  TIMELINE_ITEM_EVENT_TONE,
  TIMELINE_ITEM_I18N_KEY_MAPPING,
} from './constants'

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

const IconBox = styled(Flex)<{$color: ThemeColorAvatarColorKey}>((props) => {
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

const RELATIVE_TIME_OPTIONS: RelativeTimeOptions = {
  minimal: true,
  useTemporalPhrase: true,
}

const AvatarSkeleton = styled(Skeleton)((props) => {
  const theme = getTheme_v2(props.theme)
  return css`
    border-radius: 50%;
    width: ${theme.avatar.sizes[1].size}px;
    height: ${theme.avatar.sizes[1].size}px;
  `
})

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
  const documentVariantType = getDocumentVariantType(event.documentId)
  const {type, timestamp} = event

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
            {t(TIMELINE_ITEM_I18N_KEY_MAPPING[type])}
            {isPublishDocumentVersionEvent(event) && documentVariantType === 'published' && (
              <>
                {' '}
                {event.release ? (
                  <VersionInlineBadge $tone={getReleaseTone(event.release)}>
                    {event.release.metadata.title || t('release.placeholder-untitled-release')}
                  </VersionInlineBadge>
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
