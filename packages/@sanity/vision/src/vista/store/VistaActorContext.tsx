import {useSelector} from '@xstate/react'
import {createContext, useContext, useEffect} from 'react'

import {type useSavedQueries} from '../../hooks/useSavedQueries'
import {selectPersistedState, type VistaActorRef, type VistaSnapshot} from './vistaMachine'
import {saveVistaState} from './vistaStorage'

const PERSIST_DEBOUNCE_MS = 200

export const VistaActorContext = createContext<VistaActorRef | null>(null)

export function useVistaActor(): VistaActorRef {
  const actorRef = useContext(VistaActorContext)
  if (!actorRef) {
    throw new Error('useVistaActor must be used within a VistaActorContext provider')
  }
  return actorRef
}

export function useVistaSelector<T>(
  selector: (snapshot: VistaSnapshot) => T,
  compare?: (a: T, b: T) => boolean,
): T {
  return useSelector(useVistaActor(), selector, compare)
}

/**
 * How the tool lays itself out for the available width: two columns, request stacked above
 * response, or a single column with a switch between the two (phones).
 */
export type VistaLayout = 'columns' | 'stacked' | 'mobile'

export interface VistaExperience {
  layout: VistaLayout
  /** Leaves the redesigned experience and returns to the classic Vision tool */
  switchToClassic: () => void
}

export const VistaExperienceContext = createContext<VistaExperience | null>(null)

export function useVistaExperience(): VistaExperience {
  const experience = useContext(VistaExperienceContext)
  if (!experience) {
    throw new Error('useVistaExperience must be used within a VistaExperienceContext provider')
  }
  return experience
}

export type SavedQueriesApi = ReturnType<typeof useSavedQueries>

/** One saved queries subscription for the whole tool, shared by the menu and the drawer */
export const SavedQueriesContext = createContext<SavedQueriesApi | null>(null)

export function useSavedQueriesApi(): SavedQueriesApi {
  const api = useContext(SavedQueriesContext)
  if (!api) {
    throw new Error('useSavedQueriesApi must be used within a SavedQueriesContext provider')
  }
  return api
}

/** Writes the persisted slice of the root actor to `localStorage`, debounced, flushing on unmount */
export function usePersistVistaState(actorRef: VistaActorRef, projectId: string): void {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const subscription = actorRef.subscribe((snapshot) => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        timer = undefined
        saveVistaState(projectId, selectPersistedState(snapshot))
      }, PERSIST_DEBOUNCE_MS)
    })
    return () => {
      subscription.unsubscribe()
      if (timer !== undefined) {
        // Leaving the tool within the debounce window must not lose the last edit
        clearTimeout(timer)
        saveVistaState(projectId, selectPersistedState(actorRef.getSnapshot()))
      }
    }
  }, [actorRef, projectId])
}
