import {createContext} from 'react'

// oxlint-disable-next-line no-restricted-imports
import type {SchedulesContextValue} from '../../core/scheduled-publishing/contexts/Schedules'

/**
 * @deprecated we will be dropping support for scheduled publishing on a future major version
 * @internal
 */
export const SchedulesContext = createContext<SchedulesContextValue | undefined>(undefined)
