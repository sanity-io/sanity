import {useSelector} from '@xstate/react'
import {createContext, useContext, useLayoutEffect} from 'react'

import {type useSavedQueries} from '../../hooks/useSavedQueries'
import {onLocalStorageCleared} from '../../util/localStorage'
import {selectPersistedState, type VisionActorRef, type VisionSnapshot} from './visionMachine'
import {saveVisionState} from './visionStorage'

const PERSIST_DEBOUNCE_MS = 200

export const VisionActorContext = createContext<VisionActorRef | null>(null)

export function useVisionActor(): VisionActorRef {
  const actorRef = useContext(VisionActorContext)
  if (!actorRef) {
    throw new Error('useVisionActor must be used within a VisionActorContext provider')
  }
  return actorRef
}

export function useVisionSelector<T>(
  selector: (snapshot: VisionSnapshot) => T,
  compare?: (a: T, b: T) => boolean,
): T {
  return useSelector(useVisionActor(), selector, compare)
}

/**
 * How the tool lays itself out for the available width: two columns, request stacked above
 * response, or a single column with a switch between the two (phones).
 */
export type VisionLayout = 'columns' | 'stacked' | 'mobile'

export interface VisionExperience {
  layout: VisionLayout
  /** Leaves the redesigned experience and returns to the classic Vision tool */
  switchToClassic: () => void
}

export const VisionExperienceContext = createContext<VisionExperience | null>(null)

export function useVisionExperience(): VisionExperience {
  const experience = useContext(VisionExperienceContext)
  if (!experience) {
    throw new Error('useVisionExperience must be used within a VisionExperienceContext provider')
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

/**
 * Where the open drawer shows one of the active tab's tools (`VisionTabDrawer`): the drawer renders
 * the element, and the tab renders the tool into it, from where it has everything the tool needs
 */
export interface TabDrawerSlot {
  element: HTMLElement | null
  setElement: (element: HTMLElement | null) => void
}

export const TabDrawerSlotContext = createContext<TabDrawerSlot | null>(null)

export function useTabDrawerSlot(): TabDrawerSlot {
  const slot = useContext(TabDrawerSlotContext)
  if (!slot) {
    throw new Error('useTabDrawerSlot must be used within a TabDrawerSlotContext provider')
  }
  return slot
}

/**
 * Writes the persisted slice of the root actor to `localStorage`, debounced, flushing on unmount.
 * A write still pending when the storage is cleared is dropped instead, since flushing it would
 * put the state that was just cleared straight back.
 */
export function usePersistVisionState(actorRef: VisionActorRef, projectId: string): void {
  // A layout effect, so the subscription exists before the passive effects of the first commit
  // run: those of the tool's children run before this component's own, and a change one of them
  // makes as the tool mounts (opening a request linked from the URL) would otherwise not be saved
  useLayoutEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const dropPendingWrite = () => {
      clearTimeout(timer)
      timer = undefined
    }
    const subscription = actorRef.subscribe((snapshot) => {
      dropPendingWrite()
      timer = setTimeout(() => {
        timer = undefined
        saveVisionState(projectId, selectPersistedState(snapshot))
      }, PERSIST_DEBOUNCE_MS)
    })
    const unsubscribeClear = onLocalStorageCleared(dropPendingWrite)
    return () => {
      subscription.unsubscribe()
      unsubscribeClear()
      if (timer !== undefined) {
        // Leaving the tool within the debounce window must not lose the last edit
        clearTimeout(timer)
        saveVisionState(projectId, selectPersistedState(actorRef.getSnapshot()))
      }
    }
  }, [actorRef, projectId])
}
