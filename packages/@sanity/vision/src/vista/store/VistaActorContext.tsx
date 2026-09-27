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

/**
 * Edits still waiting in an editor debounce (params edits reach the machine debounced). The
 * mounted tab registers how to commit them, and an action that reads the tab from the machine
 * commits first, so it sees what the editors show: Run, Save and Export in the tab's menu, and
 * Save in the sidebar, which has no other way to reach the tab's debounce.
 */
export interface PendingEdits {
  /** Registers a commit for the mounted tab's pending edits; returns the unregister */
  register: (commit: () => void) => () => void
  /** Commits every pending edit registered right now */
  commit: () => void
}

export function createPendingEdits(): PendingEdits {
  const commits = new Set<() => void>()
  return {
    register: (commit) => {
      commits.add(commit)
      return () => {
        commits.delete(commit)
      }
    },
    commit: () => {
      for (const commit of commits) commit()
    },
  }
}

export const PendingEditsContext = createContext<PendingEdits | null>(null)

export function usePendingEdits(): PendingEdits {
  const pendingEdits = useContext(PendingEditsContext)
  if (!pendingEdits) {
    throw new Error('usePendingEdits must be used within a PendingEditsContext provider')
  }
  return pendingEdits
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
