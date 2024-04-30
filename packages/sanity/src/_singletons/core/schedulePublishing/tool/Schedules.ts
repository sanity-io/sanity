import {createContext} from 'react'

import type {SchedulesContextValue} from '../../../../core/scheduledPublishing/tool/contexts/schedules'

/**
 * @internal
 */
export const SchedulesContext = createContext<SchedulesContextValue | undefined>(undefined)
