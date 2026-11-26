import {uuid} from '@sanity/uuid'

import {DEFAULT_API_VERSION} from '../../apiVersions'
import {isPlainObject} from '../../util/isPlainObject'
import {getStorage, VISION_STORAGE_KEY_PREFIX} from '../../util/localStorage'
import {prefixApiVersion} from '../../util/prefixApiVersion'
import {validateApiVersion} from '../../util/validateApiVersion'
import {
  type VisionAiSettings,
  type VisionDatasetMode,
  type VisionDrawer,
  type VisionEditorSettings,
  type VisionExportSnippetId,
  type VisionExportSnippetSettings,
  type VisionResponseSettings,
  type VisionHistoryDiffSettings,
  type VisionPanelsState,
  type VisionPersistedState,
  type VisionPerspective,
  type VisionResultView,
  type VisionSavedFunction,
  type VisionSettings,
  type VisionSidebarState,
  type VisionTab,
  type VisionTabInit,
  type VisionTabOptions,
} from './types'

const STATE_VERSION = 1

export const DEFAULT_PARAMS = '{\n  \n}'

/** Every panel starts out expanded */
const DEFAULT_PANELS: VisionPanelsState = {
  params: true,
  options: true,
  paramsView: 'json',
  resultViewer: 'json',
}

/** Fields that change with every revision, so a diff of them says nothing about the content */
export const DEFAULT_HIDDEN_DIFF_FIELDS = ['_rev', '_updatedAt', '_system.base.rev']

/** Every AI feature stays on until the user switches it off */
const DEFAULT_AI_SETTINGS: VisionAiSettings = {
  enabled: true,
  generateQuery: true,
  editQuery: true,
  fixLint: true,
  generateMutations: true,
  explainQuery: true,
}

const DEFAULT_EDITOR_SETTINGS: VisionEditorSettings = {
  autoFormatOnResize: true,
}

/** The Export query dialog's tabs, in the order they come in until the user reorders them */
export const EXPORT_SNIPPET_IDS: readonly VisionExportSnippetId[] = [
  'client',
  'curl',
  'next-sanity',
  'astro',
  'sveltekit',
  'nuxt',
]

const DEFAULT_EXPORT_SNIPPET_SETTINGS: VisionExportSnippetSettings = {
  order: [...EXPORT_SNIPPET_IDS],
  hidden: [],
}

const DEFAULT_RESPONSE_SETTINGS: VisionResponseSettings = {
  resolveSyncTags: true,
  sourceMapEnabled: false,
  resultSourceMap: true,
}

export interface VisionStorageDefaults {
  datasets: string[]
  /** The workspace's dataset (or the tool's configured default); tabs follow it unless pinned */
  defaultDataset: string
  /** From the tool config, with or without the `v` prefix */
  defaultApiVersion: string
}

const VISION_PERSPECTIVES: readonly VisionPerspective[] = [
  'global',
  'raw',
  'published',
  'drafts',
  'scheduledDrafts',
]

/** The dataset tabs follow: the workspace's when the tool knows it, else the first one listed */
export function resolveWorkspaceDataset(defaults: VisionStorageDefaults): string {
  return defaults.datasets.includes(defaults.defaultDataset)
    ? defaults.defaultDataset
    : defaults.datasets[0]
}

/** Lives under Vision's prefix, so the error boundary's "Clear cache" resets it too */
export function getVisionStorageKey(projectId: string): string {
  return `${VISION_STORAGE_KEY_PREFIX}state:${projectId}`
}

/**
 * Where releases up to 6.20 kept the state. Read once and moved to the current key, so tabs,
 * saved functions and settings survive the upgrade; remove once that window has passed.
 */
export function getLegacyVisionStorageKey(projectId: string): string {
  return `${VISION_STORAGE_KEY_PREFIX}vista:${projectId}`
}

/**
 * Where the classic tool keeps the query in its editor, with its params, dataset, API version and
 * perspective. Read when no state is stored yet, so an upgrade from the classic tool keeps that
 * query; left in place, since the classic tool still reads it on releases that have it.
 */
export function getClassicVisionStorageKey(projectId: string): string {
  return `${VISION_STORAGE_KEY_PREFIX}${projectId}`
}

function readStoredState(storage: Storage, projectId: string): string | null {
  const key = getVisionStorageKey(projectId)
  const current = storage.getItem(key)
  if (current !== null) {
    return current
  }
  const legacyKey = getLegacyVisionStorageKey(projectId)
  const legacy = storage.getItem(legacyKey)
  if (legacy !== null) {
    try {
      storage.setItem(key, legacy)
      storage.removeItem(legacyKey)
    } catch {
      // Quota exceeded: keep reading the legacy key until a save succeeds
    }
  }
  return legacy
}

export function resolveDefaultSettings(defaults: VisionStorageDefaults): VisionSettings {
  const apiVersion = prefixApiVersion(defaults.defaultApiVersion)
  return {
    datasetMode: 'auto',
    dataset: resolveWorkspaceDataset(defaults),
    apiVersion: validateApiVersion(apiVersion) ? apiVersion : DEFAULT_API_VERSION,
    // Published, not `global`: the studio defaults to drafts, which a production client without a
    // token never sees, so a query that works here would come back empty there
    perspective: 'published',
    variant: 'global',
    includeSourceMap: false,
    useCdn: false,
  }
}

export function createTabOptions(settings: VisionSettings): VisionTabOptions {
  return {...settings}
}

export function createTab(settings: VisionSettings, tab: VisionTabInit = {}): VisionTab {
  return {
    id: uuid(),
    title: undefined,
    query: '',
    rawParams: DEFAULT_PARAMS,
    autoRefetch: false,
    sharedId: undefined,
    ...tab,
    options: {...createTabOptions(settings), ...tab.options},
  }
}

export function createInitialState(defaults: VisionStorageDefaults): VisionPersistedState {
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
    ai: {...DEFAULT_AI_SETTINGS},
    editor: {...DEFAULT_EDITOR_SETTINGS},
    response: {...DEFAULT_RESPONSE_SETTINGS},
    exportSnippets: {
      order: [...DEFAULT_EXPORT_SNIPPET_SETTINGS.order],
      hidden: [...DEFAULT_EXPORT_SNIPPET_SETTINGS.hidden],
    },
    functions: [],
    openedSavedQueries: [],
  }
}

/**
 * The classic tool's `pinnedRelease` (and state saved before `global` existed) reads as `global`,
 * and its `previewDrafts`, the API's old name for `drafts`, as `drafts`; `null` is how the API
 * default is stored (see `saveVisionState`)
 */
function sanitizePerspective(value: unknown): VisionPerspective {
  if (value === 'pinnedRelease') return 'global'
  if (value === 'previewDrafts') return 'drafts'
  if (value === null) return undefined
  return VISION_PERSPECTIVES.includes(value as VisionPerspective)
    ? (value as VisionPerspective)
    : undefined
}

/**
 * The stored dataset mode, or `undefined` to use the fallback. A dataset pinned before the pin
 * button gave way to Auto and overrides is an override of that dataset, and one that followed
 * the workspace is Auto; a pin of a dataset the project no longer has reads as Auto too. State
 * saved before `datasetMode` existed always stored a dataset: the workspace's was the default
 * back then, so it reads as Auto, any other one was chosen on purpose and is an override.
 */
function sanitizeDatasetMode(
  value: Record<string, unknown>,
  dataset: string | undefined,
  defaults: VisionStorageDefaults,
): VisionDatasetMode | undefined {
  switch (value.datasetMode) {
    case 'auto':
    case 'workspace':
      return 'auto'
    case 'override':
    case 'pinned':
      return dataset === undefined ? 'auto' : 'override'
    default:
      if (dataset === undefined || 'datasetMode' in value) return undefined
      return dataset === resolveWorkspaceDataset(defaults) ? 'auto' : 'override'
  }
}

/**
 * The options stored for a tab or as the settings, each field falling back to `fallback` when
 * missing or unusable
 */
function sanitizeOptions(
  value: Record<string, unknown>,
  fallback: VisionTabOptions,
  defaults: VisionStorageDefaults,
): VisionTabOptions {
  const dataset =
    typeof value.dataset === 'string' && defaults.datasets.includes(value.dataset)
      ? value.dataset
      : undefined
  const datasetMode = sanitizeDatasetMode(value, dataset, defaults) ?? fallback.datasetMode
  const apiVersion = typeof value.apiVersion === 'string' ? value.apiVersion : fallback.apiVersion
  return {
    datasetMode,
    // On `auto` the stored dataset only seeded the pin button, which is gone: it reads as the
    // workspace's, so a later override starts from what the tab queried
    dataset:
      datasetMode === 'auto' ? resolveWorkspaceDataset(defaults) : (dataset ?? fallback.dataset),
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
  fallback: VisionSettings,
  defaults: VisionStorageDefaults,
): VisionSettings {
  return isPlainObject(value) ? sanitizeOptions(value, fallback, defaults) : fallback
}

function sanitizeTab(
  value: unknown,
  settings: VisionSettings,
  defaults: VisionStorageDefaults,
): VisionTab | null {
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
    sharedId: typeof value.sharedId === 'string' ? value.sharedId : undefined,
  })
}

const DRAWERS: readonly VisionDrawer[] = ['saved', 'shared', 'delta', 'mutate', 'settings']

function sanitizeSidebar(value: unknown): VisionSidebarState {
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
 * form was chosen, and the result as JSON unless another view was; state saved before any of them
 * existed reads that way
 */
function sanitizePanels(value: unknown): VisionPanelsState {
  const panels = isPlainObject(value) ? value : {}
  return {
    params: panels.params !== false,
    options: panels.options !== false,
    paramsView: panels.paramsView === 'form' ? 'form' : 'json',
    resultViewer: sanitizeResultViewer(panels),
  }
}

/**
 * State saved before JSON became the default kept the view as `resultView`, written whether or
 * not it was chosen: its `tree` was the default then, so only `graph` reads as a choice
 */
function sanitizeResultViewer(panels: Record<string, unknown>): VisionResultView {
  if (!('resultViewer' in panels)) return panels.resultView === 'graph' ? 'graph' : 'json'
  return panels.resultViewer === 'tree' ||
    panels.resultViewer === 'graph' ||
    panels.resultViewer === 'documents'
    ? panels.resultViewer
    : 'json'
}

/** Unique, trimmed paths; state saved before the setting existed hides the default fields */
function sanitizeHistoryDiff(value: unknown): VisionHistoryDiffSettings {
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

/** A setting stays on unless it was switched off; state saved before the settings existed has all on */
function sanitizeAiSettings(value: unknown): VisionAiSettings {
  const ai = isPlainObject(value) ? value : {}
  return {
    enabled: ai.enabled !== false,
    generateQuery: ai.generateQuery !== false,
    editQuery: ai.editQuery !== false,
    fixLint: ai.fixLint !== false,
    generateMutations: ai.generateMutations !== false,
    explainQuery: ai.explainQuery !== false,
  }
}

/** A setting stays on unless it was switched off; state saved before the settings existed has all on */
function sanitizeEditorSettings(value: unknown): VisionEditorSettings {
  const editor = isPlainObject(value) ? value : {}
  return {autoFormatOnResize: editor.autoFormatOnResize !== false}
}

/**
 * Resolving sync tags stays on unless it was switched off, and the Content Source Map features stay
 * off unless they were switched on; state saved before a setting existed reads as its default
 */
function sanitizeResponseSettings(value: unknown): VisionResponseSettings {
  const response = isPlainObject(value) ? value : {}
  return {
    resolveSyncTags: response.resolveSyncTags !== false,
    sourceMapEnabled: response.sourceMapEnabled === true,
    resultSourceMap:
      response.resultSourceMap === 'withKeyArraySelector' ? 'withKeyArraySelector' : true,
  }
}

function isExportSnippetId(value: unknown): value is VisionExportSnippetId {
  return EXPORT_SNIPPET_IDS.includes(value as VisionExportSnippetId)
}

/**
 * Every snippet once, in the stored order, with snippets added since the order was saved at the
 * end; the dialog always has a tab to show, so hiding every snippet shows them all again
 */
export function sanitizeExportSnippetSettings(value: unknown): VisionExportSnippetSettings {
  const stored = isPlainObject(value) ? value : {}
  const known = (list: unknown) => [
    ...new Set(Array.isArray(list) ? list.filter(isExportSnippetId) : []),
  ]
  const order = known(stored.order)
  for (const id of EXPORT_SNIPPET_IDS) {
    if (!order.includes(id)) order.push(id)
  }
  const hidden = known(stored.hidden)
  return {order, hidden: hidden.length < order.length ? hidden : []}
}

/** Saved functions with an id and a declaration, the first of each id; state saved before had none */
function sanitizeFunctions(value: unknown): VisionSavedFunction[] {
  if (!Array.isArray(value)) return []
  const functions: VisionSavedFunction[] = []
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

/** Unique keys; state saved before saved queries opened as tabs has none */
function sanitizeOpenedSavedQueries(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter((key): key is string => typeof key === 'string'))]
}

/**
 * A fresh state whose tab holds the query the classic tool last showed, with its params and
 * request options, or the fresh state as it is when the classic tool left no query. The classic
 * tool ran queries on the `raw` perspective until another one was picked, and its
 * `pinnedRelease` reads as `global`.
 */
function seedFromClassicTool(
  storage: Storage,
  projectId: string,
  initial: VisionPersistedState,
  defaults: VisionStorageDefaults,
): VisionPersistedState {
  let classic: unknown
  try {
    classic = JSON.parse(storage.getItem(getClassicVisionStorageKey(projectId)) || 'null')
  } catch {
    return initial
  }
  if (!isPlainObject(classic) || typeof classic.query !== 'string' || !classic.query.trim()) {
    return initial
  }

  const tab = createTab(initial.settings, {
    id: initial.activeTabId,
    query: classic.query,
    rawParams: typeof classic.params === 'string' ? classic.params : DEFAULT_PARAMS,
    options: sanitizeOptions(
      {perspective: 'raw', ...classic},
      createTabOptions(initial.settings),
      defaults,
    ),
  })
  return {...initial, tabs: [tab]}
}

/**
 * Loads the persisted state for a project, dropping anything that no longer validates (unknown
 * datasets, malformed tabs, ...). Returns a fresh state when nothing usable is stored; when
 * nothing is stored at all, its tab holds the query the classic tool last showed.
 */
export function loadVisionState(
  projectId: string,
  defaults: VisionStorageDefaults,
): VisionPersistedState {
  const initial = createInitialState(defaults)
  const storage = getStorage()
  if (!storage) {
    return initial
  }

  let stored: unknown
  try {
    const raw = readStoredState(storage, projectId)
    if (raw === null) {
      return seedFromClassicTool(storage, projectId, initial, defaults)
    }
    stored = JSON.parse(raw)
  } catch {
    return initial
  }

  if (!isPlainObject(stored) || stored.version !== STATE_VERSION) {
    return initial
  }

  const settings = sanitizeSettings(stored.settings, initial.settings, defaults)
  // Tab ids key the spawned runners and the React list, so a duplicated id keeps its first tab only
  const tabs: VisionTab[] = []
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
  const ai = sanitizeAiSettings(stored.ai)
  const editor = sanitizeEditorSettings(stored.editor)
  const response = sanitizeResponseSettings(stored.response)
  const exportSnippets = sanitizeExportSnippetSettings(stored.exportSnippets)
  const functions = sanitizeFunctions(stored.functions)
  const openedSavedQueries = sanitizeOpenedSavedQueries(stored.openedSavedQueries)
  if (tabs.length === 0) {
    return {
      ...initial,
      settings,
      sidebar,
      panels,
      historyDiff,
      ai,
      editor,
      response,
      exportSnippets,
      functions,
      openedSavedQueries,
    }
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
    ai,
    editor,
    response,
    exportSnippets,
    functions,
    openedSavedQueries,
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

export function saveVisionState(projectId: string, state: VisionPersistedState): void {
  try {
    getStorage()?.setItem(getVisionStorageKey(projectId), JSON.stringify(state, persistPerspective))
  } catch {
    // Quota exceeded: the session keeps working, it just will not be restored
  }
}

export function clearVisionState(projectId: string): void {
  const storage = getStorage()
  storage?.removeItem(getVisionStorageKey(projectId))
  storage?.removeItem(getLegacyVisionStorageKey(projectId))
}
