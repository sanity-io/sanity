import {type ReleaseDocument} from '@sanity/client'
import {LockIcon} from '@sanity/icons'
import {Box, Flex, Stack, Text} from '@sanity/ui'
import {memo} from 'react'

import {Tooltip} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
import {getReleaseTitleDetails} from '../../../util/getReleaseTitleDetails'
import {getReleaseTone} from '../../../util/getReleaseTone'
import {formatRelativeLocalePublishDate, isReleaseScheduledOrScheduling} from '../../../util/util'
import {ReleaseAvatar} from '../../ReleaseAvatar'

export const VersionContextMenuItem = memo(function VersionContextMenuItem(props: {
  release: ReleaseDocument
}) {
  const {release} = props
  const {t} = useTranslation()
  const isScheduled = isReleaseScheduledOrScheduling(release)
  const titleDetails = getReleaseTitleDetails(
    release.metadata?.title,
    t('release.placeholder-untitled-release'),
  )

  return (
    <Flex gap={3} justify="center" align="center">
      <ReleaseAvatar padding={2} tone={getReleaseTone(release)} />
      <Stack flex={1} space={2}>
        <Tooltip
          disabled={!titleDetails.isTruncated}
          content={
            <Box style={{maxWidth: '300px'}}>
              <Text size={1}>{titleDetails.fullTitle}</Text>
            </Box>
          }
        >
          <Text size={1} weight="medium">
            {titleDetails.displayTitle}
          </Text>
        </Tooltip>
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
