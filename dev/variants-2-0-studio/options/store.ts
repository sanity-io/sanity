import {useSyncExternalStore} from 'react'

import {COMPONENTS, type ComponentDef, getComponent} from './registry'

// Global choice is a position in each component's option list ("first", "second", ...), or
// 'final' to follow each component's signed-off option. A per-component override beats both.
export type GlobalChoice = 'final' | 'stock' | number

/** The option id a component resolves to when the master "Stock" switch is on: render stock Studio. */
export const STOCK_OPTION = '__stock'

export type Stage = 'open-beta' | 'ga'

export interface State {
  global: GlobalChoice
  overrides: Record<string, string>
  /** C1 picker: show only the first N dimensions (null = all). Reaches the list, columns and rail forms. */
  dimensionLimit: number | null
  /** C1: open beta = exactly one variant dimension (the first); GA = all of them. */
  stage: Stage
}

const STORAGE_KEY = 'variants-2-0-studio:options'
const DEFAULT_STATE: State = {global: 0, overrides: {}, dimensionLimit: null, stage: 'open-beta'}

const DESIGN_PARAM = 'design'

/**
 * The config as one URL value, e.g. `show.b,stage.ga,dim.2,c1.b`: a link reproduces the state.
 * `show` is stock | final | a, b, c; `dim` is the GA dimension limit; `cN.x` is a per-component option.
 */
export function serializeDesign(current: State): string {
  const show =
    current.global === 'stock' || current.global === 'final' ? current.global : LETTERS[current.global]
  const parts = [`show.${show}`, `stage.${current.stage}`]
  if (current.dimensionLimit !== null) parts.push(`dim.${current.dimensionLimit}`)
  for (const [component, option] of Object.entries(current.overrides)) parts.push(`${component}.${option}`)
  return parts.join(',')
}

function parseDesign(value: string): State | null {
  const next: State = {...DEFAULT_STATE, overrides: {}}
  for (const part of value.split(',')) {
    const [key, val] = part.split('.')
    if (!key || !val) return null
    if (key === 'show') {
      if (val === 'stock' || val === 'final') next.global = val
      else if (LETTERS.includes(val)) next.global = LETTERS.indexOf(val)
    } else if (key === 'stage') {
      if (val === 'open-beta' || val === 'ga') next.stage = val
    } else if (key === 'dim') {
      next.dimensionLimit = Number(val) || null
    } else if (/^c\d+$/.test(key)) {
      next.overrides[key] = val
    }
  }
  return next
}

const LETTERS = 'abcdefgh'

/** A shared link wins over the stored state; storage is the fallback, so reload keeps the choice. */
function load(): State {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get(DESIGN_PARAM)
    const parsed = fromUrl ? parseDesign(fromUrl) : null
    if (parsed) return parsed
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? {...DEFAULT_STATE, ...JSON.parse(raw)} : DEFAULT_STATE
  } catch {
    return DEFAULT_STATE
  }
}

/** The current URL with the config in it, for "Copy link". */
export function designLink(): string {
  const url = new URL(window.location.href)
  url.searchParams.set(DESIGN_PARAM, serializeDesign(state))
  return url.toString()
}

let state: State = load()
const listeners = new Set<() => void>()

function commit(next: State) {
  state = next
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Storage can be blocked; the choice then lasts for this tab only.
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function setGlobalChoice(choice: GlobalChoice) {
  commit({...state, global: choice})
}

export function setOverride(componentId: string, optionId: string | null) {
  const overrides = {...state.overrides}
  if (optionId === null) delete overrides[componentId]
  else overrides[componentId] = optionId
  commit({...state, overrides})
}

export function setStage(stage: Stage) {
  commit({...state, stage})
}

export function setDimensionLimit(limit: number | null) {
  commit({...state, dimensionLimit: limit})
}

/** Back to what "Show" says: every per-component choice is dropped, Show and the scenario stay. */
export function resetOverrides() {
  commit({...state, overrides: {}})
}

export function resetOptions() {
  commit(DEFAULT_STATE)
}

export function resolveOption(component: ComponentDef, current: State = state): string {
  if (current.global === 'stock') return STOCK_OPTION
  const override = current.overrides[component.id]
  if (override && component.options.some((option) => option.id === override)) return override
  if (current.global === 'final') return component.final ?? component.defaultOption
  return component.options[current.global]?.id ?? component.defaultOption
}

export function useOptionState(): State {
  return useSyncExternalStore(subscribe, () => state)
}

/** The option id currently in force for a component, e.g. `useOption('c3') === 'b'`. */
export function useOption(componentId: string): string {
  const current = useOptionState()
  const component = getComponent(componentId)
  return component ? resolveOption(component, current) : 'a'
}

export function maxOptionCount(): number {
  return Math.max(...COMPONENTS.map((component) => component.options.length))
}
