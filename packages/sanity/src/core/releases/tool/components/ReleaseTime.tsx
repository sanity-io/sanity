import {LockIcon} from '@sanity/icons'
import {Box, Flex, Text} from '@sanity/ui'

import {useTranslation} from '../../../i18n'
import {useReleaseTime} from '../../hooks/useReleaseTime'
import {releasesLocaleNamespace} from '../../i18n'
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

  return (
    <Flex gap={1} align="center" wrap="wrap">
      {isReleaseScheduledOrScheduling(release) && (
        <Box paddingY={1}>
          <Text size={1} muted>
            <LockIcon data-testid="release-lock-icon" />
          </Text>
        </Box>
      )}
      <Box paddingY={1}>
        <Text size={1} muted>
          {isReleaseScheduledOrScheduling(release)
            ? tRelease('time.scheduled')
            : tRelease('time.estimated')}
        </Text>
      </Box>
      <Box paddingY={1}>
        <Text size={1} muted>
          {'·'}
        </Text>
      </Box>
      <Box paddingY={1}>
        <Text size={1} weight="medium">
          {getReleaseTime(release)}
        </Text>
      </Box>
    </Flex>
  )
}
