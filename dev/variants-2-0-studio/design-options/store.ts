import {useSyncExternalStore} from 'react'

import {getComponent, getConfig, NOT_DRAWN_LABEL} from './config'
import {type ComponentDef, type PresetDef} from './types'

// Global choice is a position in each component's option list ("first", "second", ...), or
// 'final' to follow each component's signed-off option. A per-component override beats both.
export type GlobalChoice = 'final' | 'stock' | number

/** The option id a component resolves to when the master "Stock" switch is on: render stock Studio. */
export const STOCK_OPTION = '__stock'

/** The scenario's first switch; ids come from the registry (e.g. 'open-beta' | 'ga'). */
export type Stage = string

export type RowLayout = 'left' | 'actionsRight' | 'centered'
export type PillWhenOpen = 'summary' | 'versionCount'
export type ToastAction = 'button' | 'link'
export type ToastStyle = 'stock' | 'proposed'
export type ListWhenPerspective = 'grouped' | 'sorted'
export type PriorityView = 'hide' | 'show'

export interface State {
  global: GlobalChoice
  overrides: Record<string, string>
  /** Show only the first N dimensions (null = all). */
  dimensionLimit: number | null
  stage: Stage
  /** The global pill shape: round (shipped) or box (3px). Like the theme, a preset does not change it. */
  shape: 'round' | 'box'
  /** Row layout of C1's address row (options A and B): `left`, `right` (actions pinned right, the default) or `center`. Global like the shape. */
  rowLayout: RowLayout
  /** What the top-right pill shows while the address row is open: the full `summary` or the `count` (version and a count badge, the default). Global like the shape. */
  pillWhenOpen: PillWhenOpen
  /** How a result toast shows its action: a filled `button` at the bottom right (default) or a `link` under the message. Global like the shape. */
  toastAction: ToastAction
  /** The result toast as the Studio draws it today (`stock`: 380px, no icon) or as proposed (`proposed`: a status icon, 400px, an action slot at the end). Global like the shape. */
  toastStyle: ToastStyle
  /** C3 option D, with a perspective active: the list in two sections (`grouped`, the default) or with the matching documents first (`sorted`). */
  listWhenPerspective: ListWhenPerspective
  /** Open beta scope: the inventory panel's Priority view is `hide`n (the default) or `show`n. */
  priorityView: PriorityView
  /** The preset this config started from (null = none). The config is "modified" when it no longer equals it. */
  preset: string | null
}

const DESIGN_PARAM = 'design'
const PRESET_PARAM = 'preset'
const LETTERS = 'abcdefgh'

function defaults(): State {
  return {
    global: 0,
    overrides: {},
    dimensionLimit: null,
    stage: getConfig().scenario.stages[0].id,
    shape: 'round',
    // Centred since 21 Oct (Faheem prefers it); Left and Actions right stay selectable.
    rowLayout: 'centered',
    pillWhenOpen: 'versionCount',
    toastAction: 'button',
    toastStyle: 'stock',
    listWhenPerspective: 'grouped',
    priorityView: 'hide',
    preset: null,
  }
}

/**
 * The config as one URL value, e.g. `show.b,stage.ga,dim.2,c1.b`: a link reproduces the state.
 * `show` is stock | final | a, b, c; `dim` is the dimension limit; `cN.x` is a per-component option.
 */
export function serializeDesign(current: State): string {
  const show =
    current.global === 'stock' || current.global === 'final'
      ? current.global
      : LETTERS[current.global]
  const parts = [`show.${show}`, `stage.${current.stage}`]
  if (current.dimensionLimit !== null) parts.push(`dim.${current.dimensionLimit}`)
  if (current.shape === 'box') parts.push('shape.box')
  if (current.rowLayout !== 'centered') parts.push(`rowlayout.${current.rowLayout}`)
  if (current.pillWhenOpen !== 'versionCount') parts.push('pill.summary')
  if (current.toastAction !== 'button') parts.push('toast.link')
  if (current.toastStyle !== 'stock') parts.push('toaststyle.proposed')
  if (current.listWhenPerspective !== 'grouped') parts.push('list.sorted')
  if (current.priorityView !== 'hide') parts.push('priority.show')
  for (const [component, option] of Object.entries(current.overrides).sort(([a], [b]) =>
    a.localeCompare(b),
  ))
    parts.push(`${component}.${option}`)
  return parts.join(',')
}

export function parseDesign(value: string): State | null {
  const next = defaults()
  for (const part of value.split(',')) {
    const [key, val] = part.split('.')
    if (!key || !val) return null
    if (key === 'show') {
      if (val === 'stock' || val === 'final') next.global = val
      else if (LETTERS.includes(val)) next.global = LETTERS.indexOf(val)
    } else if (key === 'stage') {
      if (getConfig().scenario.stages.some((stage) => stage.id === val)) next.stage = val
    } else if (key === 'shape') {
      if (val === 'box') next.shape = 'box'
    } else if (key === 'rowlayout') {
      if (val === 'left' || val === 'actionsRight' || val === 'centered') next.rowLayout = val
    } else if (key === 'list') {
      if (val === 'sorted') next.listWhenPerspective = 'sorted'
    } else if (key === 'priority') {
      if (val === 'show') next.priorityView = 'show'
    } else if (key === 'toaststyle') {
      if (val === 'proposed') next.toastStyle = 'proposed'
    } else if (key === 'toast') {
      if (val === 'link') next.toastAction = 'link'
    } else if (key === 'pill') {
      if (val === 'summary') next.pillWhenOpen = 'summary'
    } else if (key === 'dim') {
      next.dimensionLimit = Number(val) || null
    } else if (
      /^c\d+$/.test(key) ||
      getConfig().components.some((component) => component.id === key)
    ) {
      next.overrides[key] = val
    }
  }
  return next
}

const normalise = (design: string) => {
  const parsed = parseDesign(design)
  return parsed ? serializeDesign(parsed) : design
}

// ---- Mine (browser) presets -------------------------------------------------------------------------------------

const mineKey = () => `${getConfig().storageKey}:presets`

function loadMine(): PresetDef[] {
  try {
    const raw = window.localStorage.getItem(mineKey())
    return raw ? (JSON.parse(raw) as PresetDef[]) : []
  } catch {
    return []
  }
}

let mine: PresetDef[] | null = null
let presetVersion = 0
const presetListeners = new Set<() => void>()

function getMine(): PresetDef[] {
  if (!mine) mine = loadMine()
  return mine
}

function commitMine(next: PresetDef[]) {
  mine = next
  presetVersion++
  try {
    window.localStorage.setItem(mineKey(), JSON.stringify(next))
  } catch {
    // Storage can be blocked; presets then last for this tab only.
  }
  presetListeners.forEach((fn) => fn())
}

export function getPresets(): {shared: PresetDef[]; mine: PresetDef[]} {
  return {shared: getConfig().presets, mine: getMine()}
}

export function usePresets(): {shared: PresetDef[]; mine: PresetDef[]} {
  useSyncExternalStore(
    (fn) => {
      presetListeners.add(fn)
      return () => presetListeners.delete(fn)
    },
    () => presetVersion,
  )
  return getPresets()
}

function findPreset(id: string | null): PresetDef | undefined {
  if (!id) return undefined
  const {shared, mine: own} = getPresets()
  return [...shared, ...own].find((preset) => preset.id === id)
}

export function isMinePreset(id: string): boolean {
  return getMine().some((preset) => preset.id === id)
}

/** True when the current config differs from the active preset. */
export function isModified(current: State = state ?? defaults()): boolean {
  const preset = findPreset(current.preset)
  return (
    !!preset &&
    serializeDesign({
      ...current,
      shape: 'round',
      rowLayout: 'centered',
      pillWhenOpen: 'versionCount',
      toastAction: 'button',
      toastStyle: 'stock',
      listWhenPerspective: 'grouped',
      priorityView: 'hide',
    }) !== normalise(preset.design)
  )
}

// ---- State ------------------------------------------------------------------------------------------------------

const storageKey = () => `${getConfig().storageKey}:options`

/** A shared link wins over the stored state; storage is the fallback, so reload keeps the choice. */
function load(): State {
  try {
    const params = new URLSearchParams(window.location.search)
    const presetId = params.get(PRESET_PARAM)
    const fromUrl = params.get(DESIGN_PARAM)
    let next: State | null = null
    const preset = findPreset(presetId)
    if (preset) next = {...(parseDesign(preset.design) ?? defaults()), preset: preset.id}
    if (fromUrl) {
      const parsed = parseDesign(fromUrl)
      if (parsed) next = {...parsed, preset: next?.preset ?? null}
    }
    if (next) return next
    const raw = window.localStorage.getItem(storageKey())
    if (raw) return {...defaults(), ...JSON.parse(raw)}
    // Nothing shared and nothing saved: the config's default preset, if it names one.
    const starter = findPreset(getConfig().defaultPreset ?? null)
    return starter
      ? {...(parseDesign(starter.design) ?? defaults()), preset: starter.id}
      : defaults()
  } catch {
    return defaults()
  }
}

let state: State | null = null
const listeners = new Set<() => void>()

function current(): State {
  if (!state) state = load()
  return state
}

function commit(next: State) {
  state = next
  try {
    window.localStorage.setItem(storageKey(), JSON.stringify(next))
  } catch {
    // Storage can be blocked; the choice then lasts for this tab only.
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** The current URL with the config in it, for "Copy link". */
export function designLink(): string {
  const url = new URL(window.location.href)
  const now = current()
  url.searchParams.set(DESIGN_PARAM, serializeDesign(now))
  if (now.preset) url.searchParams.set(PRESET_PARAM, now.preset)
  else url.searchParams.delete(PRESET_PARAM)
  return url.toString()
}

export function setGlobalChoice(choice: GlobalChoice) {
  commit({...current(), global: choice})
}

export function setOverride(componentId: string, optionId: string | null) {
  const overrides = {...current().overrides}
  if (optionId === null) delete overrides[componentId]
  else overrides[componentId] = optionId
  commit({...current(), overrides})
}

export function setShape(shape: 'round' | 'box') {
  commit({...current(), shape})
}

export function setRowLayout(rowLayout: RowLayout) {
  commit({...current(), rowLayout})
}

export function setListWhenPerspective(listWhenPerspective: ListWhenPerspective) {
  commit({...current(), listWhenPerspective})
}

export function setPriorityView(priorityView: PriorityView) {
  commit({...current(), priorityView})
}

export function setToastStyle(toastStyle: ToastStyle) {
  commit({...current(), toastStyle})
}

export function setToastAction(toastAction: ToastAction) {
  commit({...current(), toastAction})
}

export function setPillWhenOpen(pillWhenOpen: PillWhenOpen) {
  commit({...current(), pillWhenOpen})
}

export function setStage(stage: Stage) {
  commit({...current(), stage})
}

export function setDimensionLimit(limit: number | null) {
  commit({...current(), dimensionLimit: limit})
}

/** Back to what "Show" says: every per-component choice is dropped, Show and the scenario stay. */
export function resetOverrides() {
  commit({...current(), overrides: {}})
}

export function resetOptions() {
  commit(defaults())
}

export function resolveOption(component: ComponentDef, now: State = current()): string {
  if (component.independent) {
    if (now.global === 'stock') return component.defaultOption
    const own = now.overrides[component.id]
    return own && component.options.some((option) => option.id === own)
      ? own
      : component.defaultOption
  }
  if (now.global === 'stock') return STOCK_OPTION
  const override = now.overrides[component.id]
  if (override && component.options.some((option) => option.id === override)) return override
  if (now.global === 'final') return component.final ?? component.defaultOption
  const chosen = component.options[now.global]
  // An option that is not drawn falls back to the default (A) instead of rendering an empty slot.
  return chosen && chosen.label !== NOT_DRAWN_LABEL ? chosen.id : component.defaultOption
}

/** True when "Show" asked for a letter this component cannot give (not drawn or missing), so it fell back. */
export function fellBack(component: ComponentDef, now: State = current()): boolean {
  if (component.independent) return false
  if (now.global === 'stock' || now.global === 'final') return false
  if (now.overrides[component.id]) return false
  const chosen = component.options[now.global]
  return !chosen || chosen.label === NOT_DRAWN_LABEL
}

export function getOptionState(): State {
  return current()
}

export function useOptionState(): State {
  return useSyncExternalStore(subscribe, current)
}

/** The option id currently in force for a component, e.g. `useOption('c3') === 'b'`. */
export function useOption(componentId: string): string {
  const now = useOptionState()
  const component = getComponent(componentId)
  return component ? resolveOption(component, now) : 'a'
}

export function maxOptionCount(): number {
  return Math.max(...getConfig().components.map((component) => component.options.length))
}

// ---- Preset actions ---------------------------------------------------------------------------------------------

export function applyPreset(id: string) {
  const preset = findPreset(id)
  const parsed = preset ? parseDesign(preset.design) : null
  // The shape is global, like the theme: a preset keeps the one that is set.
  if (preset && parsed)
    commit({
      ...parsed,
      shape: current().shape,
      rowLayout: current().rowLayout,
      pillWhenOpen: current().pillWhenOpen,
      toastAction: current().toastAction,
      toastStyle: current().toastStyle,
      listWhenPerspective: current().listWhenPerspective,
      priorityView: current().priorityView,
      preset: preset.id,
    })
}

/** Step to the previous (-1) or next (+1) preset, shared first then mine; wraps around. */
export function stepPreset(delta: 1 | -1) {
  const {shared, mine: own} = getPresets()
  const all = [...shared, ...own]
  if (!all.length) return
  const at = all.findIndex((preset) => preset.id === current().preset)
  const next =
    at === -1 ? (delta === 1 ? 0 : all.length - 1) : (at + delta + all.length) % all.length
  applyPreset(all[next].id)
}

/** Names are unique within a group. Returns an error message, or null when saved. */
export function savePresetAs(name: string): string | null {
  const trimmed = name.trim()
  if (!trimmed) return 'Give the preset a name.'
  if (getMine().some((preset) => preset.name.toLowerCase() === trimmed.toLowerCase())) {
    return 'A preset with this name already exists.'
  }
  const id = `mine-${Date.now().toString(36)}`
  commitMine([...getMine(), {id, name: trimmed, design: serializeDesign(current())}])
  commit({...current(), preset: id})
  return null
}

/** Overwrite one of Mine with the current config. Shared presets live in the repo and cannot be updated here. */
export function updatePreset(id: string) {
  if (!isMinePreset(id)) return
  commitMine(
    getMine().map((preset) =>
      preset.id === id ? {...preset, design: serializeDesign(current())} : preset,
    ),
  )
  commit({...current(), preset: id})
}

export function deletePreset(id: string) {
  if (!isMinePreset(id)) return
  commitMine(getMine().filter((preset) => preset.id !== id))
  if (current().preset === id) commit({...current(), preset: null})
}

/** Mine as JSON, for export. */
export function exportPresets(): string {
  return JSON.stringify({presets: getMine()}, null, 2)
}

/** Add presets from exported JSON. Names that already exist in Mine are skipped. Returns how many were added. */
export function importPresets(json: string): number {
  let list: PresetDef[] = []
  try {
    const parsed = JSON.parse(json)
    list = Array.isArray(parsed) ? parsed : parsed.presets
  } catch {
    return 0
  }
  const known = new Set(getMine().map((preset) => preset.name.toLowerCase()))
  const added = (list ?? [])
    .filter(
      (p) =>
        p &&
        typeof p.name === 'string' &&
        typeof p.design === 'string' &&
        !known.has(p.name.toLowerCase()),
    )
    .map((p, i) => ({id: `mine-${Date.now().toString(36)}-${i}`, name: p.name, design: p.design}))
  if (added.length) commitMine([...getMine(), ...added])
  return added.length
}

/** A short summary of a preset for the picker: "Open beta · C1 B". */
export function presetSummary(preset: PresetDef): string {
  const parsed = parseDesign(preset.design)
  if (!parsed) return ''
  const {stages} = getConfig().scenario
  if (parsed.global === 'stock') return 'Stock'
  const stage = stages.find((s) => s.id === parsed.stage)?.label ?? parsed.stage
  const show = parsed.global === 'final' ? 'Final' : `All ${LETTERS[parsed.global].toUpperCase()}`
  const overrides = Object.entries(parsed.overrides).map(
    ([id, option]) => `${id.toUpperCase()} ${option.toUpperCase()}`,
  )
  return [stage, show, ...overrides].join(' · ')
}
