import {CircleIcon} from '@sanity/icons/Circle'
import {LockIcon} from '@sanity/icons/Lock'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Box, Flex, Icon, Text} from 'ui5'

import {ToneIcon} from '../../../../ui-components/toneIcon/ToneIcon'
import {Tooltip} from '../../../../ui-components/tooltip/Tooltip'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {useReleaseTime} from '../../hooks/useReleaseTime'
import {releasesLocaleNamespace} from '../../i18n'
import {ARCHIVED_RELEASE_STATES} from '../../util/const'
import {getReleaseTiming} from '../../util/getReleaseTiming'
import {isReleaseScheduledOrScheduling} from '../../util/util'
import {type TableRelease} from '../overview/ReleasesOverview'
import {useReleaseLabelMode} from '../overview/useReleaseLabelMode'

type ReleaseTimeProps = {release: TableRelease; compact?: boolean}

export const ReleaseTime: React.FC<ReleaseTimeProps> = (props) => {
  const mode = useReleaseLabelMode()
  return mode === 'current' ? <ReleaseTimeCurrent {...props} /> : <ReleaseTimeTwoState {...props} />
}

/**
 * Two-state labels (see naming-model-decision.md). One adaptive, single-line cell:
 *  - armed (scheduled)          → lock icon, then the date
 *  - intended date, not armed   → caution icon, then the date (a plan, not a commitment)
 *  - no date                    → "Unscheduled"
 */
function ReleaseTimeTwoState({release, compact}: ReleaseTimeProps) {
  const {t} = useTranslation(releasesLocaleNamespace)
  const getReleaseTime = useReleaseTime()

  const timing = getReleaseTiming(release)
  const isInArchivedView = ARCHIVED_RELEASE_STATES.includes(release.state)
  const dateLabel = getReleaseTime(release, {compact})

  // Archived or published: just the date, no schedule-state glyph.
  if (isInArchivedView) {
    return (
      <Text size={1} muted as="div" trim={true} style={{whiteSpace: 'nowrap'}}>
        {dateLabel ?? '-'}
      </Text>
    )
  }

  // Unscheduled with no date: keep the leading glyph slot so the text lines up with the other rows.
  if (!timing.date) {
    return (
      <Flex gap={2} alignItems="center" data-testid="release-unscheduled">
        <Icon size={1} muted icon={CircleIcon} />
        <Text size={1} muted weight="medium" as="div" trim={true} style={{whiteSpace: 'nowrap'}}>
          {t('schedule.unscheduled')}
        </Text>
      </Flex>
    )
  }

  // Armed: a timer will fire.
  if (timing.scheduled) {
    return (
      <Flex gap={2} alignItems="center">
        <Icon size={1} muted icon={LockIcon} data-testid="release-lock-icon" />
        <Text size={1} weight="medium" as="div" trim={true} style={{whiteSpace: 'nowrap'}}>
          {dateLabel}
        </Text>
      </Flex>
    )
  }

  // A date is set, but the release is not armed. Flag it; the tooltip explains.
  return (
    <Tooltip
      content={
        <Text size={1} as="div" trim={true}>
          {t(timing.overdue ? 'schedule.overdue-tooltip' : 'schedule.intended-tooltip')}
        </Text>
      }
      portal
    >
      <Flex gap={2} alignItems="center" data-testid="release-not-scheduled">
        <Text size={1} as="div" trim={true}>
          <ToneIcon icon={WarningOutlineIcon} tone="caution" />
        </Text>
        <Text size={1} weight="medium" as="div" trim={true} style={{whiteSpace: 'nowrap'}}>
          {dateLabel}
        </Text>
      </Flex>
    </Tooltip>
  )
}

/** The labels Studio ships today: ASAP, Undecided, or Scheduled/Estimated with the date. */
function ReleaseTimeCurrent({release}: ReleaseTimeProps) {
  const {t} = useTranslation()
  const {t: tRelease} = useTranslation(releasesLocaleNamespace)
  const getReleaseTime = useReleaseTime()

  const {metadata} = release

  if (metadata.releaseType === 'asap') {
    return (
      <Text size={1} muted weight="medium" as="div" trim={true}>
        {t('release.type.asap')}
      </Text>
    )
  }
  if (metadata.releaseType === 'undecided') {
    return (
      <Text size={1} muted weight="medium" style={{opacity: 0.5}} as="div" trim={true}>
        {t('release.type.undecided')}
      </Text>
    )
  }

  const isScheduledOrScheduling = isReleaseScheduledOrScheduling(release)
  const isInArchivedView = ARCHIVED_RELEASE_STATES.includes(release.state)

  return (
    <Flex gap={1} alignItems="center" flexWrap="wrap">
      {isScheduledOrScheduling && (
        <Box paddingY={1}>
          <Icon
            size={1}
            muted
            style={{margin: '-0.375rem'}}
            icon={LockIcon}
            data-testid="release-lock-icon"
          />
        </Box>
      )}
      {!isInArchivedView && (
        <>
          <Box paddingY={1}>
            <Text size={1} muted as="div" trim={true}>
              {isScheduledOrScheduling ? tRelease('time.scheduled') : tRelease('time.estimated')}
            </Text>
          </Box>
          <Box paddingY={1}>
            <Text size={1} muted as="div" trim={true}>
              {'·'}
            </Text>
          </Box>
        </>
      )}
      <Box paddingY={1}>
        <Text size={1} weight="medium" as="div" trim={true}>
          {getReleaseTime(release)}
        </Text>
      </Box>
    </Flex>
  )
}
