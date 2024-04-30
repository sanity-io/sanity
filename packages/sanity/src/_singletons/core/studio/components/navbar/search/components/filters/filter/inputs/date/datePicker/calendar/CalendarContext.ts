import {createContext} from 'react'

import type {CalendarContextValue} from '../../../../../../../../../../../../../core/studio/components/navbar/search/components/filters/filter/inputs/date/datePicker/calendar/contexts/CalendarContext'

/**
 * @internal
 */
export const CalendarContext = createContext<CalendarContextValue | undefined>(undefined)
