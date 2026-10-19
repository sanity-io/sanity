import {useSyncExternalStore} from 'react'

import {COMPONENTS, type ComponentDef, getComponent} from './registry'

// Global choice is a position in each component's option list ("first", "second", ...), or
// 'final' to follow each component's signed-off option. A per-component override beats both.
export type GlobalChoice = 'final' | number

interface State {
  global: GlobalChoice
  overrides: Record<string, string>
}

const STORAGE_KEY = 'variants-2-0-studio:options'
const DEFAULT_STATE: State = {global: 0, overrides: {}}

function load(): State {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? {...DEFAULT_STATE, ...JSON.parse(raw)} : DEFAULT_STATE
  } catch {
    return DEFAULT_STATE
  }
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

export function resetOptions() {
  commit(DEFAULT_STATE)
}

export function resolveOption(component: ComponentDef, current: State = state): string {
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
