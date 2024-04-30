import {useContext} from 'react'
import {CalendarContext} from 'sanity/_singletons'

import {type CalendarContextValue} from './CalendarContext'

export function useCalendar(): CalendarContextValue {
  const context = useContext(CalendarContext)
  if (context === undefined) {
    throw new Error('useCalendar must be used within an CalendarContext.Provider')
  }
  return context
}
