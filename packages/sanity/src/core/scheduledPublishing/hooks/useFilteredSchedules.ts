import {useMemo} from 'react'

import {type Schedule, type ScheduleState} from '../../studio/timezones/types'

export function useFilteredSchedules(schedules: Schedule[], filter?: ScheduleState): Schedule[] {
  return useMemo(
    () => schedules.filter((schedule) => schedule.state === filter),
    [schedules, filter],
  )
}
