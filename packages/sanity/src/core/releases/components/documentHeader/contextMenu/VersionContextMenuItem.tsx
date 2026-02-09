import {type ReleaseDocument} from '@sanity/client'
import {LockIcon} from '@sanity/icons'
import {Flex, Stack, Text} from '@sanity/ui'
import {memo} from 'react'

import {useTimeZone} from '../../../../hooks/useTimeZone'
import {useTranslation} from '../../../../i18n'
import {CONTENT_RELEASES_TIME_ZONE_SCOPE} from '../../../../studio/constants'
import {getReleaseTone} from '../../../util/getReleaseTone'
import {formatRelativeTzPublishDate, isReleaseScheduledOrScheduling} from '../../../util/util'
import {ReleaseAvatar} from '../../ReleaseAvatar'

export const VersionContextMenuItem = memo(function VersionContextMenuItem(props: {
  release: ReleaseDocument
}) {
  const {release} = props
  const {t} = useTranslation()
  const isScheduled = isReleaseScheduledOrScheduling(release)
  const {formatDateTz} = useTimeZone(CONTENT_RELEASES_TIME_ZONE_SCOPE)

  return (
    <Flex gap={3} justify="center" align="center">
      <ReleaseAvatar padding={2} tone={getReleaseTone(release)} />
      <Stack flex={1} space={2}>
        <Text size={1} weight="medium">
          {release.metadata?.title || t('release.placeholder-untitled-release')}
        </Text>
        <Text muted size={1}>
          {release.metadata.releaseType === 'asap' && <>{t('release.type.asap')}</>}
          {release.metadata.releaseType === 'scheduled' &&
            (release.metadata.intendedPublishAt ? (
              <>{formatRelativeTzPublishDate(release, formatDateTz)}</>
            ) : (
              <>{t('release.chip.tooltip.unknown-date')}</>
            ))}
          {release.metadata.releaseType === 'undecided' && <>{t('release.type.undecided')}</>}
        </Text>
      </Stack>
      {isScheduled && <LockIcon />}
    </Flex>
  )
})
