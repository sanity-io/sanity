import {createContext} from 'react'

export interface DatePickerContextValue {
  fontSize: number
}

export const DatePickerContext = createContext<DatePickerContextValue | undefined>(undefined)
