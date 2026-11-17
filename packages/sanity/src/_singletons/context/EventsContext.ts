import {createContext} from 'react'

import type {EventsStore} from '../../core/store/events/types'

/**
 * @internal
 */
export const EventsContext = createContext<EventsStore | null>(null)
