import {useSyncExternalStore} from 'react'

import {type Seg} from './markModel'

// The change selected in the Review changes panel (reviewPanel C): the field mark of that change thickens (a two-way link). A module store,
// because the panel and the marks are in different parts of the pane.
let selected: readonly Seg[] | null = null
const listeners = new Set<() => void>()
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => void listeners.delete(l)
}

export function selectChange(path: readonly Seg[] | null) {
  selected = path
  listeners.forEach((l) => l())
}

const keyOf = (path: readonly Seg[]) =>
  path.map((s) => (typeof s === 'object' ? `{${s._key}}` : String(s))).join('/')
let cachedKey: string | null = null
const getKey = () => {
  const next = selected ? keyOf(selected) : null
  cachedKey = next
  return cachedKey
}

/** True when the selected change is at or below this path: the mark of that field (or of a container holding it) thickens. */
export function useIsSelected(path: readonly Seg[]): boolean {
  const key = useSyncExternalStore(subscribe, getKey)
  if (!key) return false
  const mine = keyOf(path)
  return key === mine || key.startsWith(`${mine}/`)
}
