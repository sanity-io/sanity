import {createContext} from 'react'

export interface CalendarContextValue {
  date?: Date
  endDate?: Date
  focusedDate: Date
  fontSize: number
  selectRange?: boolean
  selectTime?: boolean

  /**
   * An integer indicating the first day of the week.
   * Can be either 1 (Monday) or 7 (Sunday).
   */
  firstWeekDay: 1 | 7
}

export const CalendarContext = createContext<CalendarContextValue | undefined>(undefined)
