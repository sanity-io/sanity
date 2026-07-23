import {LockIcon} from '@sanity/icons/Lock'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Flex, Text} from '@sanity/ui'

import {ToneIcon} from '../../../../ui-components/toneIcon/ToneIcon'
import {Tooltip} from '../../../../ui-components/tooltip/Tooltip'
import {useTranslation} from '../../../i18n'
import {useReleaseTime} from '../../hooks/useReleaseTime'
import {releasesLocaleNamespace} from '../../i18n'
import {ARCHIVED_RELEASE_STATES} from '../../util/const'
import {getReleaseTiming} from '../../util/getReleaseTiming'
import {type TableRelease} from '../overview/ReleasesOverview'

/**
 * Renders a release's timing in the two-state model (see
 * naming-model-decision.md). One adaptive, single-line cell:
 *  - armed (scheduled)          → 🔒 <date>
 *  - intended date, not armed   → ⚠ <date>  (a plan, not a commitment)
 *  - no date                    → "Unscheduled"
 */
export const ReleaseTime: React.FC<{release: TableRelease; compact?: boolean}> = ({
  release,
  compact,
}) => {
  const {t} = useTranslation(releasesLocaleNamespace)
  const getReleaseTime = useReleaseTime()

  const timing = getReleaseTiming(release)
  const isInArchivedView = ARCHIVED_RELEASE_STATES.includes(release.state)
  const dateLabel = getReleaseTime(release, {compact})

  // Archived / published: just the date, no schedule-state glyph.
  if (isInArchivedView) {
    return (
      <Text size={1} muted>
        {dateLabel ?? '-'}
      </Text>
    )
  }

  // Unscheduled with no date → the category word carries it.
  if (!timing.date) {
    return (
      <Text size={1} muted weight="medium">
        {t('schedule.unscheduled')}
      </Text>
    )
  }

  // Armed: a timer will fire.
  if (timing.scheduled) {
    return (
      <Flex gap={2} align="center">
        <Text size={1} muted>
          <LockIcon data-testid="release-lock-icon" />
        </Text>
        <Text size={1} weight="medium">
          {dateLabel}
        </Text>
      </Flex>
    )
  }

  // A date is set, but the release is NOT armed — flag it (caution), tooltip teaches.
  return (
    <Tooltip
      content={
        <Text size={1}>
          {t(timing.overdue ? 'schedule.overdue-tooltip' : 'schedule.intended-tooltip')}
        </Text>
      }
      portal
    >
      <Flex gap={2} align="center" data-testid="release-not-scheduled">
        <Text size={1}>
          <ToneIcon icon={WarningOutlineIcon} tone="caution" />
        </Text>
        <Text size={1} weight="medium">
          {dateLabel}
        </Text>
      </Flex>
    </Tooltip>
  )
}
