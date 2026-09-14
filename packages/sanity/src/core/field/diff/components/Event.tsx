import {
  type AvatarSize,
  AvatarStack,
  Skeleton,
  Stack,
  Text,
  useTheme_v2 as useThemeV2,
} from '@sanity/ui'
import {type ThemeColorAvatarColorKey} from '@sanity/ui/theme'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {type ComponentProps, useMemo} from 'react'
import {Box, Flex} from 'ui5'

import {Tooltip} from '../../../../ui-components/tooltip/Tooltip'
import {UserAvatar} from '../../../components/userAvatar/UserAvatar'
import {useDateTimeFormat} from '../../../hooks/useDateTimeFormat'
import {type RelativeTimeOptions, useRelativeTime} from '../../../hooks/useRelativeTime'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {ReleaseTitle} from '../../../releases/components/ReleaseTitle'
import {VersionInlineBadge} from '../../../releases/components/VersionInlineBadge'
import {isReleaseDocument} from '../../../releases/store/types'
import {useAllReleases} from '../../../releases/store/useAllReleases'
import {getReleaseDocumentIdFromReleaseId} from '../../../releases/util/getReleaseDocumentIdFromReleaseId'
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
  avatarSize0Var,
  avatarSize1Var,
  avatarSkeleton,
  iconBox,
  iconBoxColor,
  nameSkeleton,
  textLineHeight0Var,
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

const RELATIVE_TIME_OPTIONS: RelativeTimeOptions = {
  minimal: true,
  useTemporalPhrase: true,
}

function AvatarSkeleton(props: ComponentProps<typeof Skeleton>) {
  const {className, style, ...rest} = props
  const {avatar} = useThemeV2()

  return (
    <Skeleton
      {...rest}
      className={clsx(avatarSkeleton, className)}
      style={{...assignInlineVars({[avatarSize1Var]: `${avatar.sizes[1].size}px`}), ...style}}
    />
  )
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

/**
 * Resolves and renders the release badge behind a release publish. Kept as a separate component
 * so only publish-event rows subscribe to the releases store — a releases-store emission should
 * not re-render every timeline row. When the release is missing from the store (e.g. it was
 * deleted) a stub `{_id}` keeps the badge rendered; draft publishes (no `releaseId`) show the
 * draft badge.
 */
function PublishEventReleaseBadge({releaseId}: {releaseId: string | undefined}) {
  const {t} = useTranslation('studio')
  const {map: releasesMap} = useAllReleases()
  const releaseDocumentId = releaseId ? getReleaseDocumentIdFromReleaseId(releaseId) : undefined
  const release = releaseDocumentId
    ? releasesMap.get(releaseDocumentId) || {_id: releaseDocumentId, metadata: undefined}
    : undefined

  if (!release) {
    return <VersionInlineBadge $tone="caution">{t('changes.versions.draft')}</VersionInlineBadge>
  }
  return (
    <ReleaseTitle
      title={release.metadata?.title}
      fallback={t('release.placeholder-untitled-release')}
    >
      {({displayTitle}) => (
        <VersionInlineBadge
          $tone={isReleaseDocument(release) ? getReleaseTone(release) : 'default'}
        >
          {displayTitle}
        </VersionInlineBadge>
      )}
    </ReleaseTitle>
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
      <Flex alignItems="center" gap={3}>
        <div style={{position: 'relative'}}>
          <UserAvatarStack maxLength={3} userIds={userIds.filter(Boolean)} size={2} />
          <IconBox
            alignItems="center"
            justifyContent="center"
            $color={TIMELINE_ITEM_EVENT_TONE[type]}
          >
            <Text size={0}>{IconComponent && <IconComponent />}</Text>
          </IconBox>
        </div>
        <Stack gap={2}>
          <Text size={1} weight="medium">
            {t(TIMELINE_ITEM_I18N_KEY_MAPPING[documentVariantType][type])}
            {isPublishDocumentVersionEvent(event) && documentVariantType === 'published' && (
              <>
                {' '}
                <PublishEventReleaseBadge releaseId={event.releaseId} />
              </>
            )}
          </Text>

          <Text as="time" size={1} muted dateTime={timestamp} title={formattedTimestamp}>
            {updatedTimeAgo}
          </Text>
        </Stack>

        {contributors.length > 0 && showChangesBy == 'tooltip' && (
          <Flex flexBasis="0%" flexGrow={1} justifyContent="flex-end" alignItems="center">
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
