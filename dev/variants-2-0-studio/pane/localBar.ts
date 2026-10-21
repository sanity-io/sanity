import {useSyncExternalStore} from 'react'
import {usePaneRouter} from 'sanity/structure'

// Whether a pane's local bar (Figma C2 section 561:35886, B1 to B3) is open. Shared by the header (the perspective circle opens and closes it), the
// bar under the header (shows it) and the inventory (a row click opens it). Keyed by pane, so each pane has its own; no state in the URL.
const opened = new Set<string>()
const listeners = new Set<() => void>()
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => void listeners.delete(listener)
}

export function useLocalBar(): [boolean, (open: boolean) => void] {
  const {groupIndex, siblingIndex} = usePaneRouter()
  const key = `${groupIndex}:${siblingIndex}`
  const open = useSyncExternalStore(subscribe, () => opened.has(key))
  const setOpen = (next: boolean) => {
    if (next) opened.add(key)
    else opened.delete(key)
    listeners.forEach((listener) => listener())
  }
  return [open, setOpen]
}

// The circle of each pane, so the bar can put its caret under it (the header clips what hangs below it, so the caret is drawn from the bar).
const circles = new Map<string, HTMLElement>()
export function useCircleRegistry(): {
  key: string
  register: (el: HTMLElement | null) => void
  find: () => HTMLElement | undefined
} {
  const {groupIndex, siblingIndex} = usePaneRouter()
  const key = `${groupIndex}:${siblingIndex}`
  return {
    key,
    register: (el) => {
      if (el) circles.set(key, el)
      else circles.delete(key)
    },
    find: () => circles.get(key),
  }
}
