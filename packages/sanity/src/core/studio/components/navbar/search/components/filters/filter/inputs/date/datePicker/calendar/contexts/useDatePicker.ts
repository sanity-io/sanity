import {useContext} from 'react'
import {CalendarContext, type CalendarContextValue} from 'sanity/_singletons'

export function useCalendar(): CalendarContextValue {
  const context = useContext(CalendarContext)
  if (context === undefined) {
    throw new Error('useCalendar must be used within an CalendarContext.Provider')
  }
  return context
}
