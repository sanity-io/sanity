import {createContext} from 'react'

export interface CalendarContextValue {
  date?: Date
  endDate?: Date
  focusedDate: Date
  fontSize: number
  selectRange?: boolean
  selectTime?: boolean
}

export const CalendarContext = createContext<CalendarContextValue | undefined>(undefined)
