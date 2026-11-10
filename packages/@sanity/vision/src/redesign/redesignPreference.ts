import {useSyncExternalStore} from 'react'

import {isPlainObject} from '../util/isPlainObject'
import {getStorage, onLocalStorageCleared, VISION_STORAGE_KEY_PREFIX} from '../util/localStorage'

/**
 * Whether a user chose the redesigned Vision experience for a project, and whether they dismissed
 * the invitation toast. Stored in `localStorage`, so the choice is per browser and per project.
 */
export interface RedesignPreference {
  optedIn: boolean
  dismissed: boolean
}

const DEFAULT_PREFERENCE: RedesignPreference = {optedIn: false, dismissed: false}

/**
 * Storage is the source of truth (so "Clear cache and retry" in the error boundary is honoured);
 * the parsed object is cached per raw string only to keep `useSyncExternalStore` snapshots stable.
 */
const cache = new Map<string, {raw: string | null; preference: RedesignPreference}>()
const listeners = new Set<() => void>()

function storageKey(projectId: string): string {
  return `${VISION_STORAGE_KEY_PREFIX}redesign:${projectId}`
}

function notify(): void {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  // "Clear cache" must also forget in-memory choices, which is all there is without storage
  const unsubscribeClear = onLocalStorageCleared(() => {
    cache.clear()
    listener()
  })
  return () => {
    listeners.delete(listener)
    unsubscribeClear()
  }
}

function parsePreference(raw: string | null): RedesignPreference {
  if (raw === null) {
    return DEFAULT_PREFERENCE
  }
  try {
    const stored: unknown = JSON.parse(raw)
    return isPlainObject(stored)
      ? {optedIn: stored.optedIn === true, dismissed: stored.dismissed === true}
      : DEFAULT_PREFERENCE
  } catch {
    return DEFAULT_PREFERENCE
  }
}

export function readRedesignPreference(projectId: string): RedesignPreference {
  const storage = getStorage()
  const cached = cache.get(projectId)
  if (!storage) {
    // Without storage the in-memory choice is all there is
    return cached?.preference ?? DEFAULT_PREFERENCE
  }
  const raw = storage.getItem(storageKey(projectId))
  if (cached && cached.raw === raw) {
    return cached.preference
  }
  const preference = parsePreference(raw)
  cache.set(projectId, {raw, preference})
  return preference
}

export function writeRedesignPreference(
  projectId: string,
  patch: Partial<RedesignPreference>,
): RedesignPreference {
  const next = {...readRedesignPreference(projectId), ...patch}
  const storage = getStorage()
  let raw: string | null = JSON.stringify(next)
  try {
    storage?.setItem(storageKey(projectId), raw)
  } catch {
    // Quota exceeded: the choice still applies for this session, keyed on what storage holds
    raw = storage?.getItem(storageKey(projectId)) ?? null
  }
  cache.set(projectId, {raw, preference: next})
  notify()
  return next
}

/** Forgets both the opt-in and the dismissal, so the classic tool offers the redesign again */
export function clearRedesignPreference(projectId: string): void {
  getStorage()?.removeItem(storageKey(projectId))
  cache.delete(projectId)
  notify()
}

export function useRedesignPreference(projectId: string): RedesignPreference {
  return useSyncExternalStore(
    subscribe,
    () => readRedesignPreference(projectId),
    () => DEFAULT_PREFERENCE,
  )
}
