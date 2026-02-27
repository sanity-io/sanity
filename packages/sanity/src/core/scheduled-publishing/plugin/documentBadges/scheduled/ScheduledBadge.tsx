import {format} from 'date-fns/format'

import {type DocumentBadgeComponent} from '../../../../config/document/badges'
import {DATE_FORMAT} from '../../../../studio/timezones/constants'
import {debugWithName} from '../../../../studio/timezones/utils/debug'
import {SCHEDULE_ACTION_DICTIONARY} from '../../../constants'
import usePollSchedules from '../../../hooks/usePollSchedules'

const debug = debugWithName('ScheduledBadge')

// React Compiler needs functions that are hooks to have the `use` prefix, pascal case are treated as a component, these are hooks even though they're confusingly named `DocumentBadgeComponent`
const useScheduledBadge: DocumentBadgeComponent = (props) => {
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
useScheduledBadge.displayName = 'ScheduledBadge'

/**
 * @deprecated we will be dropping support for scheduled publishing on a future major version
 * @beta
 */
export const ScheduledBadge = useScheduledBadge
