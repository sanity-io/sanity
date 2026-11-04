// Document tabs: the tab list, kept outside React so every part of the bar reads one copy. The URL stays the source of truth for what is OPEN
// (the structure path's panes); this store only remembers which documents are TABS, in what order, which one is split, and what to announce.
import {useSyncExternalStore} from 'react'

export interface Tab {
  id: string
  type: string
  /** The raw structure-path group for the document (`id` or `id,type=book`), so a tab reopens as it was. */
  group: string
}

export interface TabsState {
  tabs: Tab[]
  /** The tab shown beside the active one, or null. */
  split: string | null
  /** The list, unfolded over the document (the breadcrumb is open). */
  listOpen: boolean
  /** The last screen-reader message; `tick` makes a repeated message announce again. */
  announce: {text: string; tick: number}
}

const KEY = 'variants-2-0-studio:doc-tabs'
const EMPTY: TabsState = {tabs: [], split: null, listOpen: false, announce: {text: '', tick: 0}}

function load(): TabsState {
  try {
    const raw = window.sessionStorage.getItem(KEY)
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw) as {tabs?: Tab[]}
    return {...EMPTY, tabs: Array.isArray(parsed.tabs) ? parsed.tabs : []}
  } catch {
    return EMPTY
  }
}

let state: TabsState = load()
const listeners = new Set<() => void>()

function set(next: Partial<TabsState>) {
  state = {...state, ...next}
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify({tabs: state.tabs}))
  } catch {
    // Storage can be blocked; the tabs then live for this page only.
  }
  for (const listener of listeners) listener()
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const useTabs = () => useSyncExternalStore(subscribe, () => state)
export const getTabs = () => state

export const idOf = (group: string) => group.split(',')[0]

export function say(text: string) {
  set({announce: {text, tick: state.announce.tick + 1}})
}

/** Adds the document as the last tab if it is not one. Returns true when it was added. */
export function ensureTab(tab: Tab): boolean {
  if (state.tabs.some((t) => t.id === tab.id)) return false
  set({tabs: [...state.tabs, tab]})
  return true
}

export function removeTab(id: string) {
  set({tabs: state.tabs.filter((t) => t.id !== id), split: state.split === id ? null : state.split})
}

/** Moves a tab to `to` (an index). */
export function moveTab(id: string, to: number) {
  const from = state.tabs.findIndex((t) => t.id === id)
  if (from < 0) return
  const next = state.tabs.slice()
  const [tab] = next.splice(from, 1)
  next.splice(Math.max(0, Math.min(next.length, to)), 0, tab)
  set({tabs: next})
}

export const setSplit = (split: string | null) => {
  if (state.split !== split) set({split})
}
export const setListOpen = (listOpen: boolean) => {
  if (state.listOpen !== listOpen) set({listOpen})
}
