import {useContext} from 'react'
import {DatePickerContext, DatePickerContextValue} from './DatePickerContext'

export function useDatePicker(): DatePickerContextValue {
  const context = useContext(DatePickerContext)
  if (context === undefined) {
    throw new Error('useDatePicker must be used within an DatePickerProvider')
  }
  return context
}
