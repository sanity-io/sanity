/**
 * REVIEW BUILD ONLY. Never part of a pull request.
 *
 * Which delete dialog the version inventory shows, so a live team session can compare them on the
 * same document:
 *
 * - `main`: the dialog and rules on `main`.
 * - `baseline`: the open beta baseline (the real code at the normal paths).
 * - `c`: the option C proposal (#15984).
 *
 * Read from the `?delete=main|baseline|c` search param, then sessionStorage. Defaults to `c` (Faheem,
 * 25 Nov: reviewers test option C without adding `?delete=c`).
 */
import {useSyncExternalStore} from 'react'

export type DeleteMode = 'main' | 'baseline' | 'c'

export const DELETE_MODES: DeleteMode[] = ['main', 'baseline', 'c']

export const DELETE_MODE_LABELS: Record<DeleteMode, string> = {
  main: 'Main',
  baseline: 'Baseline',
  c: 'Option C',
}

const DEFAULT_MODE: DeleteMode = 'c'
const SEARCH_PARAM = 'delete'
const STORAGE_KEY = 'sanity.reviewBuild.deleteMode.v2'

const listeners = new Set<() => void>()

function isDeleteMode(value: unknown): value is DeleteMode {
  return value === 'main' || value === 'baseline' || value === 'c'
}

function readSearchParam(): DeleteMode | undefined {
  if (typeof window === 'undefined') return undefined
  const value = new URLSearchParams(window.location.search).get(SEARCH_PARAM)
  return isDeleteMode(value) ? value : undefined
}

function readStorage(): DeleteMode | undefined {
  try {
    const value = window.sessionStorage.getItem(STORAGE_KEY)
    return isDeleteMode(value) ? value : undefined
  } catch {
    return undefined
  }
}

function writeStorage(mode: DeleteMode): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, mode)
  } catch {
    // Storage can be unavailable (private windows); the URL param still works.
  }
}

function getDeleteMode(): DeleteMode {
  const fromUrl = readSearchParam()
  if (fromUrl) {
    // Remembered, so the mode survives the studio router dropping the search param.
    if (readStorage() !== fromUrl) writeStorage(fromUrl)
    return fromUrl
  }
  return readStorage() ?? DEFAULT_MODE
}

/** Switches the mode, keeping a `?delete=` param in the address bar in agreement with it. */
export function setDeleteMode(mode: DeleteMode): void {
  writeStorage(mode)
  if (typeof window !== 'undefined' && readSearchParam()) {
    const url = new URL(window.location.href)
    url.searchParams.set(SEARCH_PARAM, mode)
    window.history.replaceState(window.history.state, '', url)
  }
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  if (typeof window !== 'undefined') window.addEventListener('popstate', listener)
  return () => {
    listeners.delete(listener)
    if (typeof window !== 'undefined') window.removeEventListener('popstate', listener)
  }
}

export function useDeleteMode(): DeleteMode {
  return useSyncExternalStore(subscribe, getDeleteMode, () => DEFAULT_MODE)
}

/**
 * The selection to re-open the dialog with after a mode switch, which remounts the inventory (each
 * mode runs its own deletion machine).
 */
let pendingReopen: {documentId: string; selectedIds: string[]} | undefined

export function setPendingReopen(documentId: string, selectedIds: string[]): void {
  pendingReopen = {documentId, selectedIds}
}

export function takePendingReopen(documentId: string): string[] | undefined {
  if (pendingReopen?.documentId !== documentId) return undefined
  const {selectedIds} = pendingReopen
  pendingReopen = undefined
  return selectedIds
}
