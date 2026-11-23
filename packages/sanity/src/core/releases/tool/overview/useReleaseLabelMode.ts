import {useSyncExternalStore} from 'react'

/**
 * Which timing labels the releases overview shows.
 *
 * - `two-state`: Scheduled or Unscheduled. A date that is not armed is flagged as a plan, not a
 *   commitment. Derived on read from the release (see `getReleaseTiming`), no data change.
 * - `current`: the labels Studio ships today (ASAP, Estimated, Undecided).
 *
 * Prototype switch for design review, so both can be compared on the same data. Set it with the
 * `releaseLabels` URL parameter (`?releaseLabels=current` or `?releaseLabels=two-state`); the
 * choice is remembered in this browser.
 *
 * @internal
 */
export type ReleaseLabelMode = 'two-state' | 'current'

const STORAGE_KEY = 'sanity:releases:labelMode'
const PARAM = 'releaseLabels'
const DEFAULT_MODE: ReleaseLabelMode = 'two-state'

const listeners = new Set<() => void>()

function isMode(value: unknown): value is ReleaseLabelMode {
  return value === 'two-state' || value === 'current'
}

function read(): ReleaseLabelMode {
  if (typeof window === 'undefined') return DEFAULT_MODE
  try {
    const fromUrl = new URLSearchParams(window.location.search).get(PARAM)
    if (isMode(fromUrl)) {
      window.localStorage.setItem(STORAGE_KEY, fromUrl)
      return fromUrl
    }
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (isMode(stored)) return stored
  } catch {
    // Storage can be unavailable (private mode, blocked site data). Fall back to the default.
  }
  return DEFAULT_MODE
}

/** @internal */
export function setReleaseLabelMode(mode: ReleaseLabelMode): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    // ignore, the in-memory notify below still re-renders
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  window.addEventListener('popstate', listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('popstate', listener)
  }
}

/** @internal */
export function useReleaseLabelMode(): ReleaseLabelMode {
  return useSyncExternalStore(subscribe, read, () => DEFAULT_MODE)
}
