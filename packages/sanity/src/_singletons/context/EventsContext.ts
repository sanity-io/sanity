import {createContext} from 'sanity/_createContext'

import type {EventsStore} from '../../core/store/events/types'

/**
 * @internal
 */
export const EventsContext: React.Context<EventsStore | null> = createContext<EventsStore | null>(
  'sanity/_singletons/context/events',
  null,
)
