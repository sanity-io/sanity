import {createContext} from 'sanity/_createContext'

import type {SchedulesContextValue} from '../../core/scheduledPublishing/tool/contexts/schedules'

/**
 * @internal
 */
export const SchedulesContext = createContext<SchedulesContextValue | undefined>(
  'sanity/_singletons/context/schedules',
  undefined,
)
