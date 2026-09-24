import {useSyncExternalStore} from 'react'

import {isPlainObject} from '../util/isPlainObject'
import {getStorage, VISION_STORAGE_KEY_PREFIX} from '../util/localStorage'

/**
 * Whether a user chose the redesigned Vision experience for a project, and whether they dismissed
 * the invitation toast. Stored in `localStorage`, so the choice is per browser and per project.
 */
export interface RedesignPreference {
  optedIn: boolean
  dismissed: boolean
}

const DEFAULT_PREFERENCE: RedesignPreference = {optedIn: false, dismissed: false}

const cache = new Map<string, RedesignPreference>()
const listeners = new Set<() => void>()

function storageKey(projectId: string): string {
  return `${VISION_STORAGE_KEY_PREFIX}redesign:${projectId}`
}

function notify(): void {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function readRedesignPreference(projectId: string): RedesignPreference {
  const cached = cache.get(projectId)
  if (cached) {
    return cached
  }

  let preference = DEFAULT_PREFERENCE
  try {
    const stored: unknown = JSON.parse(getStorage()?.getItem(storageKey(projectId)) || 'null')
    if (isPlainObject(stored)) {
      preference = {optedIn: stored.optedIn === true, dismissed: stored.dismissed === true}
    }
  } catch {
    // Malformed JSON: fall back to the default
  }
  cache.set(projectId, preference)
  return preference
}

export function writeRedesignPreference(
  projectId: string,
  patch: Partial<RedesignPreference>,
): RedesignPreference {
  const next = {...readRedesignPreference(projectId), ...patch}
  cache.set(projectId, next)
  try {
    getStorage()?.setItem(storageKey(projectId), JSON.stringify(next))
  } catch {
    // Quota exceeded: the choice still applies for this session
  }
  notify()
  return next
}

/** Forgets both the opt-in and the dismissal, so the classic tool offers the redesign again */
export function clearRedesignPreference(projectId: string): void {
  cache.set(projectId, DEFAULT_PREFERENCE)
  getStorage()?.removeItem(storageKey(projectId))
  notify()
}

export function useRedesignPreference(projectId: string): RedesignPreference {
  return useSyncExternalStore(
    subscribe,
    () => readRedesignPreference(projectId),
    () => DEFAULT_PREFERENCE,
  )
}
