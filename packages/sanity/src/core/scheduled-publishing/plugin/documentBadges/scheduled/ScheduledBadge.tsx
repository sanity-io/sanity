import {format} from 'date-fns'

import {type DocumentBadgeComponent} from '../../../../config/document/badges'
import {DATE_FORMAT} from '../../../../studio/timezones/constants'
import {debugWithName} from '../../../../studio/timezones/utils/debug'
import {SCHEDULE_ACTION_DICTIONARY} from '../../../constants'
import usePollSchedules from '../../../hooks/usePollSchedules'

const debug = debugWithName('ScheduledBadge')

/**
 * @beta
 */
export const ScheduledBadge: DocumentBadgeComponent = (props) => {
  // Poll for document schedules
  const {schedules} = usePollSchedules({documentId: props.id, state: 'scheduled'})
  debug('schedules', schedules)

  const upcomingSchedule = schedules?.[0]

  if (!upcomingSchedule || !upcomingSchedule.executeAt || !upcomingSchedule.action) {
    return null
  }

  const formattedDateTime = format(new Date(upcomingSchedule.executeAt), DATE_FORMAT.LARGE)

  return {
    color: SCHEDULE_ACTION_DICTIONARY[upcomingSchedule.action].badgeColor,
    label: `Scheduled`,
    title: `${
      SCHEDULE_ACTION_DICTIONARY[upcomingSchedule.action].actionName
    } on ${formattedDateTime} (local time)`,
  }
}
