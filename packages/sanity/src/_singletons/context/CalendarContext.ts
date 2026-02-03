import type {CalendarContextValue} from '../../core/studio/components/navbar/search/components/filters/filter/inputs/date/datePicker/calendar/contexts/CalendarContext'
import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export const CalendarContext = createContext<CalendarContextValue | undefined>(
  'sanity/_singletons/context/calendar',
  undefined,
)
