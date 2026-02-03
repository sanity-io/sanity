import {type Schedule, type ScheduleState} from '../types'
import {useMemo} from 'react'

export function useFilteredSchedules(schedules: Schedule[], filter?: ScheduleState): Schedule[] {
  return useMemo(
    () => schedules.filter((schedule) => schedule.state === filter),
    [schedules, filter],
  )
}
