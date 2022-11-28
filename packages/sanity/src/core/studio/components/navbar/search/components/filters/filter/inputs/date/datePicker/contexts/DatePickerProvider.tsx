import React, {ReactNode} from 'react'
import {DatePickerContext} from './DatePickerContext'

interface DatePickerProviderProps {
  children?: ReactNode
  fontSize?: number
}

export function DatePickerProvider({children, fontSize = 1}: DatePickerProviderProps) {
  return <DatePickerContext.Provider value={{fontSize}}>{children}</DatePickerContext.Provider>
}
