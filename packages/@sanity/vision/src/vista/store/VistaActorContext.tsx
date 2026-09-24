import {useSelector} from '@xstate/react'
import {createContext, useContext, useEffect} from 'react'

import {selectPersistedState, type VistaActorRef, type VistaSnapshot} from './vistaMachine'
import {saveVistaState} from './vistaStorage'

const PERSIST_DEBOUNCE_MS = 200

export const VistaActorContext = createContext<VistaActorRef | null>(null)

export interface VistaExperience {
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

/** Writes the persisted slice of the root actor to `localStorage`, debounced */
export function usePersistVistaState(actorRef: VistaActorRef, projectId: string): void {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const subscription = actorRef.subscribe((snapshot) => {
      clearTimeout(timer)
      timer = setTimeout(
        () => saveVistaState(projectId, selectPersistedState(snapshot)),
        PERSIST_DEBOUNCE_MS,
      )
    })
    return () => {
      clearTimeout(timer)
      subscription.unsubscribe()
    }
  }, [actorRef, projectId])
}
