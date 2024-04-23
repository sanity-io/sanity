import {format} from 'date-fns'

import {type DocumentBadgeComponent} from '../../../../config/document/badges'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {DATE_FORMAT, SCHEDULE_ACTION_DICTIONARY} from '../../../constants'
import usePollSchedules from '../../../hooks/usePollSchedules'
import {scheduledPublishingNamespace} from '../../../i18n'
import {debugWithName} from '../../../utils/debug'

const debug = debugWithName('ScheduledBadge')

/**
 * @beta
 */
export const ScheduledBadge: DocumentBadgeComponent = (props) => {
  const {t} = useTranslation(scheduledPublishingNamespace)
  // Poll for document schedules
  const {schedules} = usePollSchedules({documentId: props.id, state: 'scheduled'})
  debug('schedules', schedules)

  const upcomingSchedule = schedules?.[0]

  if (!upcomingSchedule || !upcomingSchedule.executeAt) {
    return null
  }

  const formattedDateTime = format(new Date(upcomingSchedule.executeAt), DATE_FORMAT.LARGE)
  const action = t(SCHEDULE_ACTION_DICTIONARY[upcomingSchedule.action].actionName)
  return {
    color: SCHEDULE_ACTION_DICTIONARY[upcomingSchedule.action].badgeColor,
    label: t('badge.label'),
    title: t('badge.title', {
      action,
      time: formattedDateTime,
    }),
  }
}
