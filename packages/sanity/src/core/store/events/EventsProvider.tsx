import {useContext} from 'react'
import {type EventsStore} from 'sanity'
import {EventsContext} from 'sanity/_singletons'

interface EventsProviderProps {
  value: EventsStore
  children: React.ReactNode
}
export function EventsProvider({value, children}: EventsProviderProps) {
  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>
}

export function useEvents(): EventsStore {
  const context = useContext(EventsContext)
  if (context === null) {
    throw new Error('useEvents must be used within a EventsProvider')
  }
  return context
}
