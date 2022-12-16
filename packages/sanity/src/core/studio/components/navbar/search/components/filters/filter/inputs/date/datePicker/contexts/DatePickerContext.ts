import {createContext} from 'react'

export interface DatePickerContextValue {
  date?: Date
  endDate?: Date
  focusedDate: Date
  fontSize: number
  selectRange?: boolean
  selectTime?: boolean
}

export const DatePickerContext = createContext<DatePickerContextValue | undefined>(undefined)
