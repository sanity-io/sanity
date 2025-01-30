import {useContext} from 'react'
import {EventsContext} from 'sanity/_singletons'

import {type EventsStore} from './types'

interface EventsProviderProps {
  value: EventsStore
  children: React.ReactNode
}
/**
 * @internal
 */
export function EventsProvider({value, children}: EventsProviderProps) {
  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>
}

/**
 * @internal
 */
export function useEvents(): EventsStore {
  const context = useContext(EventsContext)
  if (context === null) {
    throw new Error('useEvents must be used within a EventsProvider')
  }
  return context
}
