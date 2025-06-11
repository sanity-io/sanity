import {createContext} from 'sanity/_createContext'

import type {Schedule, ScheduleSort, ScheduleState} from '../../core/scheduledPublishing/types'

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

/**
 * @internal
 */
export const SchedulesContext = createContext<SchedulesContextValue | undefined>(
  'sanity/_singletons/context/schedules',
  undefined,
)
