import {type Context} from 'react'
import {createContext} from 'sanity/_createContext'

// oxlint-disable-next-line no-restricted-imports
import type {SchedulesContextValue} from '../../core/scheduled-publishing/contexts/Schedules'

/**
 * @deprecated we will be dropping support for scheduled publishing on a future major version
 * @internal
 */
export const SchedulesContext: Context<SchedulesContextValue | undefined> = createContext<
  SchedulesContextValue | undefined
>('sanity/_singletons/context/schedules', undefined)
