import {type ReleaseDocument} from '@sanity/client'
import {LockIcon} from '@sanity/icons'
import {Flex, Stack, Text} from '@sanity/ui'
import {memo} from 'react'

import {useTranslation} from '../../../../i18n'
import {formatRelativeLocalePublishDate, isReleaseScheduledOrScheduling} from '../../../util/util'
import {ReleaseAvatar} from '../../ReleaseAvatar'
import {ReleaseTitle} from '../../ReleaseTitle'

export const VersionContextMenuItem = memo(function VersionContextMenuItem(props: {
  release: ReleaseDocument
}) {
  const {release} = props
  const {t} = useTranslation()
  const isScheduled = isReleaseScheduledOrScheduling(release)

  return (
    <Flex gap={3} justify="center" align="center">
      <ReleaseAvatar padding={2} release={release} />
      <Stack flex={1} space={2}>
        <ReleaseTitle
          title={release.metadata?.title}
          fallback={t('release.placeholder-untitled-release')}
          textProps={{size: 1, weight: 'medium'}}
        />
        <Text muted size={1}>
          {release.metadata.releaseType === 'asap' && <>{t('release.type.asap')}</>}
          {release.metadata.releaseType === 'scheduled' &&
            (release.metadata.intendedPublishAt ? (
              <>{formatRelativeLocalePublishDate(release)}</>
            ) : (
              /** should not be allowed to do, but a fall back in case if somehow no date is added */
              <>{t('release.chip.tooltip.unknown-date')}</>
            ))}
          {release.metadata.releaseType === 'undecided' && <>{t('release.type.undecided')}</>}
        </Text>
      </Stack>
      {isScheduled && <LockIcon />}
    </Flex>
  )
})
