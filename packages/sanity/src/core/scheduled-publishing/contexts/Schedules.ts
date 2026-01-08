import {type Schedule, type ScheduleSort, type ScheduleState} from '../types'

/**
 * @internal
 */
export interface SchedulesContextValue {
  activeSchedules: Schedule[]
  schedules: Schedule[]
  schedulesByDate: (date: Date) => Schedule[]
  scheduleState?: ScheduleState
  selectedDate?: Date
  setSortBy: (sortBy: ScheduleSort) => void
  sortBy?: ScheduleSort
}
