import {LockIcon} from '@sanity/icons/Lock'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Box, Flex, Text} from '@sanity/ui'

import {ToneIcon} from '../../../../ui-components/toneIcon/ToneIcon'
import {Tooltip} from '../../../../ui-components/tooltip/Tooltip'
import {useTranslation} from '../../../i18n'
import {useReleaseTime} from '../../hooks/useReleaseTime'
import {releasesLocaleNamespace} from '../../i18n'
import {ARCHIVED_RELEASE_STATES} from '../../util/const'
import {isReleaseScheduledOrScheduling} from '../../util/util'
import {type TableRelease} from '../overview/ReleasesOverview'

export const ReleaseTime: React.FC<{release: TableRelease}> = ({release}) => {
  const {t} = useTranslation()
  const {t: tRelease} = useTranslation(releasesLocaleNamespace)
  const getReleaseTime = useReleaseTime()

  const {metadata} = release

  if (metadata.releaseType === 'asap') {
    return (
      <Text size={1} muted weight="medium">
        {t('release.type.asap')}
      </Text>
    )
  }
  if (metadata.releaseType === 'undecided') {
    return (
      <Text size={1} muted weight="medium" style={{opacity: 0.5}}>
        {t('release.type.undecided')}
      </Text>
    )
  }

  // For scheduled releases:

  const isScheduledOrScheduling = isReleaseScheduledOrScheduling(release)
  const isInArchivedView = ARCHIVED_RELEASE_STATES.includes(release.state)

  return (
    <Flex gap={1} align="center" wrap="wrap">
      {isScheduledOrScheduling && (
        <Box paddingY={1}>
          <Text size={1} muted>
            <LockIcon data-testid="release-lock-icon" />
          </Text>
        </Box>
      )}
      {!isInArchivedView && (
        <>
          <Box paddingY={1}>
            {isScheduledOrScheduling ? (
              <Text size={1} muted>
                {tRelease('time.scheduled')}
              </Text>
            ) : (
              // Intended date set, but the release is NOT scheduled — it will not publish until the
              // user confirms the schedule. Flag it (caution) rather than the soft "Estimated".
              <Tooltip
                content={<Text size={1}>{tRelease('time.not-scheduled-tooltip')}</Text>}
                portal
              >
                <Flex gap={1} align="center" data-testid="release-not-scheduled">
                  <Text size={1}>
                    <ToneIcon icon={WarningOutlineIcon} tone="caution" />
                  </Text>
                  <Text size={1} weight="medium">
                    {tRelease('time.not-scheduled')}
                  </Text>
                </Flex>
              </Tooltip>
            )}
          </Box>
          <Box paddingY={1}>
            <Text size={1} muted>
              {'·'}
            </Text>
          </Box>
        </>
      )}
      <Box paddingY={1}>
        <Text size={1} weight="medium">
          {getReleaseTime(release)}
        </Text>
      </Box>
    </Flex>
  )
}
