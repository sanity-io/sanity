import type {EventsStore} from '../../core/store/events/types'
import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export const EventsContext = createContext<EventsStore | null>(
  'sanity/_singletons/context/events',
  null,
)
