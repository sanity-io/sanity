import React, {ReactNode} from 'react'
import {DatePickerContext} from './DatePickerContext'

interface DatePickerProviderProps {
  children?: ReactNode
  fontSize?: number
  selectRange?: boolean
}

export function DatePickerProvider({children, fontSize = 1, selectRange}: DatePickerProviderProps) {
  return (
    <DatePickerContext.Provider value={{fontSize, selectRange}}>
      {children}
    </DatePickerContext.Provider>
  )
}
