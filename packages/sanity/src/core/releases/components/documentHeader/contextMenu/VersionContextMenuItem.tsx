import {type ReleaseDocument} from '@sanity/client'
import {LockIcon} from '@sanity/icons/Lock'
import {Text} from '@sanity/ui'
import {memo} from 'react'
import {Flex} from 'ui5'

import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {useFormatRelativeLocalePublishDate} from '../../../hooks/useFormatRelativeLocalePublishDate'
import {isReleaseScheduledOrScheduling} from '../../../util/util'
import {ReleaseAvatar} from '../../ReleaseAvatar'
import {ReleaseTitle} from '../../ReleaseTitle'

export const VersionContextMenuItem = memo(function VersionContextMenuItem(props: {
  release: ReleaseDocument
}) {
  const {release} = props
  const {t} = useTranslation()
  const formatPublishDate = useFormatRelativeLocalePublishDate()
  const isScheduled = isReleaseScheduledOrScheduling(release)

  return (
    <Flex gap={3} justifyContent="center" alignItems="center">
      <ReleaseAvatar padding={2} release={release} />
      <Flex flexBasis="0%" flexGrow={1} gap={2} flexDirection="column">
        <ReleaseTitle
          title={release.metadata?.title}
          fallback={t('release.placeholder-untitled-release')}
          textProps={{size: 1, weight: 'medium'}}
        />
        <Text muted size={1}>
          {release.metadata.releaseType === 'asap' && <>{t('release.type.asap')}</>}
          {release.metadata.releaseType === 'scheduled' &&
            (release.metadata.intendedPublishAt ? (
              <>{formatPublishDate(release)}</>
            ) : (
              /** should not be allowed to do, but a fall back in case if somehow no date is added */
              <>{t('release.chip.tooltip.unknown-date')}</>
            ))}
          {release.metadata.releaseType === 'undecided' && <>{t('release.type.undecided')}</>}
        </Text>
      </Flex>
      {isScheduled && <LockIcon />}
    </Flex>
  )
})
