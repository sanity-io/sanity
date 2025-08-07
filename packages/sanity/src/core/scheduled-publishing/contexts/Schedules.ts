import {createContext} from 'sanity/_createContext'

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

/**
 * @deprecated we will be dropping support for scheduled publishing on a future major version
 * @internal
 */
export const SchedulesContext: React.Context<SchedulesContextValue | undefined> = createContext<
  SchedulesContextValue | undefined
>('sanity/_singletons/context/schedules', undefined)
