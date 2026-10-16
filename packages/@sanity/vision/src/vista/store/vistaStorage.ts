import {uuid} from '@sanity/uuid'

import {DEFAULT_API_VERSION} from '../../apiVersions'
import {isPlainObject} from '../../util/isPlainObject'
import {getStorage, VISION_STORAGE_KEY_PREFIX} from '../../util/localStorage'
import {prefixApiVersion} from '../../util/prefixApiVersion'
import {validateApiVersion} from '../../util/validateApiVersion'
import {
  type VistaDatasetMode,
  type VistaDrawer,
  type VistaHistoryDiffSettings,
  type VistaPanelsState,
  type VistaPersistedState,
  type VistaPerspective,
  type VistaSavedFunction,
  type VistaSettings,
  type VistaSidebarState,
  type VistaTab,
  type VistaTabInit,
  type VistaTabOptions,
} from './types'

const STATE_VERSION = 1

export const DEFAULT_PARAMS = '{\n  \n}'

/** Every panel starts out expanded */
const DEFAULT_PANELS: VistaPanelsState = {
  params: true,
  options: true,
  paramsView: 'json',
  resultView: 'tree',
}

/** Fields that change with every revision, so a diff of them says nothing about the content */
export const DEFAULT_HIDDEN_DIFF_FIELDS = ['_rev', '_updatedAt', '_system.base.rev']

export interface VistaStorageDefaults {
  datasets: string[]
  /** The workspace's dataset (or the tool's configured default); tabs follow it unless pinned */
  defaultDataset: string
  /** From the tool config, with or without the `v` prefix */
  defaultApiVersion: string
}

const VISTA_PERSPECTIVES: readonly VistaPerspective[] = [
  'global',
  'raw',
  'published',
  'drafts',
  'scheduledDrafts',
]

/** The dataset tabs follow: the workspace's when the tool knows it, else the first one listed */
export function resolveWorkspaceDataset(defaults: VistaStorageDefaults): string {
  return defaults.datasets.includes(defaults.defaultDataset)
    ? defaults.defaultDataset
    : defaults.datasets[0]
}

/** Lives under the classic tool's prefix so its error boundary's "Clear cache" resets both */
export function getVistaStorageKey(projectId: string): string {
  return `${VISION_STORAGE_KEY_PREFIX}vista:${projectId}`
}

export function resolveDefaultSettings(defaults: VistaStorageDefaults): VistaSettings {
  const apiVersion = prefixApiVersion(defaults.defaultApiVersion)
  return {
    datasetMode: 'workspace',
    dataset: resolveWorkspaceDataset(defaults),
    apiVersion: validateApiVersion(apiVersion) ? apiVersion : DEFAULT_API_VERSION,
    perspective: 'global',
    variant: 'global',
    includeSourceMap: false,
    useCdn: false,
  }
}

export function createTabOptions(settings: VistaSettings): VistaTabOptions {
  return {...settings}
}

export function createTab(settings: VistaSettings, tab: VistaTabInit = {}): VistaTab {
  return {
    id: uuid(),
    title: undefined,
    query: '',
    rawParams: DEFAULT_PARAMS,
    autoRefetch: false,
    ...tab,
    options: {...createTabOptions(settings), ...tab.options},
  }
}

export function createInitialState(defaults: VistaStorageDefaults): VistaPersistedState {
  const settings = resolveDefaultSettings(defaults)
  const tab = createTab(settings)
  return {
    version: STATE_VERSION,
    tabs: [tab],
    activeTabId: tab.id,
    settings,
    sidebar: {expanded: false, drawer: null},
    panels: {...DEFAULT_PANELS},
    historyDiff: {hiddenFields: [...DEFAULT_HIDDEN_DIFF_FIELDS]},
    functions: [],
  }
}

/**
 * The classic tool's `pinnedRelease` (and state saved before `global` existed) reads as `global`;
 * `null` is how the API default is stored (see `saveVistaState`)
 */
function sanitizePerspective(value: unknown): VistaPerspective {
  if (value === 'pinnedRelease') return 'global'
  if (value === null) return undefined
  return VISTA_PERSPECTIVES.includes(value as VistaPerspective)
    ? (value as VistaPerspective)
    : undefined
}

/**
 * The options stored for a tab or as the settings, each field falling back to `fallback` when
 * missing or unusable. State saved before `datasetMode` existed always stored a dataset: the
 * workspace's was the default back then, so it keeps following the workspace, any other one
 * was chosen on purpose and stays pinned.
 */
function sanitizeOptions(
  value: Record<string, unknown>,
  fallback: VistaTabOptions,
  defaults: VistaStorageDefaults,
): VistaTabOptions {
  const dataset =
    typeof value.dataset === 'string' && defaults.datasets.includes(value.dataset)
      ? value.dataset
      : undefined
  let legacyMode: VistaDatasetMode | undefined
  if (dataset !== undefined && !('datasetMode' in value)) {
    legacyMode = dataset === resolveWorkspaceDataset(defaults) ? 'workspace' : 'pinned'
  }
  const apiVersion = typeof value.apiVersion === 'string' ? value.apiVersion : fallback.apiVersion
  return {
    datasetMode:
      value.datasetMode === 'pinned' || value.datasetMode === 'workspace'
        ? value.datasetMode
        : (legacyMode ?? fallback.datasetMode),
    dataset: dataset ?? fallback.dataset,
    apiVersion: validateApiVersion(apiVersion) ? apiVersion : fallback.apiVersion,
    perspective:
      'perspective' in value ? sanitizePerspective(value.perspective) : fallback.perspective,
    variant:
      value.variant === 'none' || value.variant === 'global' ? value.variant : fallback.variant,
    includeSourceMap:
      typeof value.includeSourceMap === 'boolean'
        ? value.includeSourceMap
        : fallback.includeSourceMap,
    useCdn: typeof value.useCdn === 'boolean' ? value.useCdn : fallback.useCdn,
  }
}

function sanitizeSettings(
  value: unknown,
  fallback: VistaSettings,
  defaults: VistaStorageDefaults,
): VistaSettings {
  return isPlainObject(value) ? sanitizeOptions(value, fallback, defaults) : fallback
}

function sanitizeTab(
  value: unknown,
  settings: VistaSettings,
  defaults: VistaStorageDefaults,
): VistaTab | null {
  if (!isPlainObject(value) || typeof value.id !== 'string') {
    return null
  }
  const options = isPlainObject(value.options) ? value.options : {}

  return createTab(settings, {
    id: value.id,
    title: typeof value.title === 'string' ? value.title : undefined,
    query: typeof value.query === 'string' ? value.query : '',
    rawParams: typeof value.rawParams === 'string' ? value.rawParams : DEFAULT_PARAMS,
    autoRefetch: value.autoRefetch === true,
    options: sanitizeOptions(options, createTabOptions(settings), defaults),
  })
}

const DRAWERS: readonly VistaDrawer[] = [
  'saved',
  'shared',
  'lint',
  'functions',
  'delta',
  'mutate',
  'settings',
]

function sanitizeSidebar(value: unknown): VistaSidebarState {
  if (!isPlainObject(value)) {
    return {expanded: false, drawer: null}
  }
  return {
    expanded: value.expanded === true,
    drawer: DRAWERS.find((drawer) => drawer === value.drawer) ?? null,
  }
}

/**
 * A panel stays expanded unless it was explicitly collapsed, the params show as JSON unless the
 * form was chosen, and the result as a tree unless JSON was; state saved before any of them
 * existed reads that way
 */
function sanitizePanels(value: unknown): VistaPanelsState {
  const panels = isPlainObject(value) ? value : {}
  return {
    params: panels.params !== false,
    options: panels.options !== false,
    paramsView: panels.paramsView === 'form' ? 'form' : 'json',
    resultView:
      panels.resultView === 'json' || panels.resultView === 'graph' ? panels.resultView : 'tree',
  }
}

/** Unique, trimmed paths; state saved before the setting existed hides the default fields */
function sanitizeHistoryDiff(value: unknown): VistaHistoryDiffSettings {
  const fields = isPlainObject(value) ? value.hiddenFields : undefined
  if (!Array.isArray(fields)) return {hiddenFields: [...DEFAULT_HIDDEN_DIFF_FIELDS]}
  return {
    hiddenFields: [
      ...new Set(
        fields.flatMap((field) =>
          typeof field === 'string' && field.trim() ? [field.trim()] : [],
        ),
      ),
    ],
  }
}

/** Saved functions with an id and a declaration, the first of each id; state saved before had none */
function sanitizeFunctions(value: unknown): VistaSavedFunction[] {
  if (!Array.isArray(value)) return []
  const functions: VistaSavedFunction[] = []
  const seenIds = new Set<string>()
  for (const candidate of value) {
    if (
      isPlainObject(candidate) &&
      typeof candidate.id === 'string' &&
      typeof candidate.declaration === 'string' &&
      !seenIds.has(candidate.id)
    ) {
      seenIds.add(candidate.id)
      functions.push({id: candidate.id, declaration: candidate.declaration})
    }
  }
  return functions
}

/**
 * Loads the persisted state for a project, dropping anything that no longer validates (unknown
 * datasets, malformed tabs, ...). Returns a fresh state when nothing usable is stored.
 */
export function loadVistaState(
  projectId: string,
  defaults: VistaStorageDefaults,
): VistaPersistedState {
  const initial = createInitialState(defaults)
  const storage = getStorage()
  if (!storage) {
    return initial
  }

  let stored: unknown
  try {
    stored = JSON.parse(storage.getItem(getVistaStorageKey(projectId)) || 'null')
  } catch {
    return initial
  }

  if (!isPlainObject(stored) || stored.version !== STATE_VERSION) {
    return initial
  }

  const settings = sanitizeSettings(stored.settings, initial.settings, defaults)
  // Tab ids key the spawned runners and the React list, so a duplicated id keeps its first tab only
  const tabs: VistaTab[] = []
  const seenIds = new Set<string>()
  for (const candidate of Array.isArray(stored.tabs) ? stored.tabs : []) {
    const tab = sanitizeTab(candidate, settings, defaults)
    if (tab && !seenIds.has(tab.id)) {
      seenIds.add(tab.id)
      tabs.push(tab)
    }
  }

  const sidebar = sanitizeSidebar(stored.sidebar)
  const panels = sanitizePanels(stored.panels)
  const historyDiff = sanitizeHistoryDiff(stored.historyDiff)
  const functions = sanitizeFunctions(stored.functions)
  if (tabs.length === 0) {
    return {...initial, settings, sidebar, panels, historyDiff, functions}
  }

  const activeTabId =
    typeof stored.activeTabId === 'string' && tabs.some((tab) => tab.id === stored.activeTabId)
      ? stored.activeTabId
      : tabs[0].id

  return {
    version: STATE_VERSION,
    tabs,
    activeTabId,
    settings,
    sidebar,
    panels,
    historyDiff,
    functions,
  }
}

/**
 * The API default perspective is `undefined`, which `JSON.stringify` leaves out, and a missing
 * field reads as "not stored" and falls back to the settings' perspective on load; written as
 * `null` the choice survives
 */
function persistPerspective(key: string, value: unknown): unknown {
  return key === 'perspective' && value === undefined ? null : value
}

export function saveVistaState(projectId: string, state: VistaPersistedState): void {
  try {
    getStorage()?.setItem(getVistaStorageKey(projectId), JSON.stringify(state, persistPerspective))
  } catch {
    // Quota exceeded: the session keeps working, it just will not be restored
  }
}

export function clearVistaState(projectId: string): void {
  getStorage()?.removeItem(getVistaStorageKey(projectId))
}
