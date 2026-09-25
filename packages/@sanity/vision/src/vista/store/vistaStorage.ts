import {uuid} from '@sanity/uuid'

import {DEFAULT_API_VERSION} from '../../apiVersions'
import {isSupportedPerspective, type SupportedPerspective} from '../../perspectives'
import {isPlainObject} from '../../util/isPlainObject'
import {getStorage, VISION_STORAGE_KEY_PREFIX} from '../../util/localStorage'
import {prefixApiVersion} from '../../util/prefixApiVersion'
import {validateApiVersion} from '../../util/validateApiVersion'
import {
  type VistaPanelsState,
  type VistaPersistedState,
  type VistaSettings,
  type VistaSidebarState,
  type VistaTab,
  type VistaTabInit,
  type VistaTabOptions,
} from './types'

const STATE_VERSION = 1

export const DEFAULT_PARAMS = '{\n  \n}'

/** Every panel starts out expanded */
const DEFAULT_PANELS: VistaPanelsState = {params: true, options: true}

export interface VistaStorageDefaults {
  datasets: string[]
  defaultDataset: string
  /** From the tool config, with or without the `v` prefix */
  defaultApiVersion: string
}

/** Lives under the classic tool's prefix so its error boundary's "Clear cache" resets both */
export function getVistaStorageKey(projectId: string): string {
  return `${VISION_STORAGE_KEY_PREFIX}vista:${projectId}`
}

export function resolveDefaultSettings(defaults: VistaStorageDefaults): VistaSettings {
  const apiVersion = prefixApiVersion(defaults.defaultApiVersion)
  return {
    dataset: defaults.datasets.includes(defaults.defaultDataset)
      ? defaults.defaultDataset
      : defaults.datasets[0],
    apiVersion: validateApiVersion(apiVersion) ? apiVersion : DEFAULT_API_VERSION,
    perspective: 'raw',
    includeSourceMap: false,
  }
}

export function createTabOptions(settings: VistaSettings): VistaTabOptions {
  return {
    dataset: settings.dataset,
    apiVersion: settings.apiVersion,
    perspective: settings.perspective,
    includeSourceMap: settings.includeSourceMap,
  }
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
  }
}

function sanitizePerspective(value: unknown): SupportedPerspective | undefined {
  return typeof value === 'string' && isSupportedPerspective(value) ? value : undefined
}

function sanitizeSettings(
  value: unknown,
  fallback: VistaSettings,
  datasets: string[],
): VistaSettings {
  if (!isPlainObject(value)) {
    return fallback
  }
  const apiVersion = typeof value.apiVersion === 'string' ? value.apiVersion : fallback.apiVersion
  return {
    dataset:
      typeof value.dataset === 'string' && datasets.includes(value.dataset)
        ? value.dataset
        : fallback.dataset,
    apiVersion: validateApiVersion(apiVersion) ? apiVersion : fallback.apiVersion,
    perspective:
      'perspective' in value ? sanitizePerspective(value.perspective) : fallback.perspective,
    includeSourceMap:
      typeof value.includeSourceMap === 'boolean'
        ? value.includeSourceMap
        : fallback.includeSourceMap,
  }
}

function sanitizeTab(value: unknown, settings: VistaSettings, datasets: string[]): VistaTab | null {
  if (!isPlainObject(value) || typeof value.id !== 'string') {
    return null
  }
  const options = isPlainObject(value.options) ? value.options : {}
  const apiVersion =
    typeof options.apiVersion === 'string' && validateApiVersion(options.apiVersion)
      ? options.apiVersion
      : undefined

  return createTab(settings, {
    id: value.id,
    title: typeof value.title === 'string' ? value.title : undefined,
    query: typeof value.query === 'string' ? value.query : '',
    rawParams: typeof value.rawParams === 'string' ? value.rawParams : DEFAULT_PARAMS,
    autoRefetch: value.autoRefetch === true,
    options: {
      ...createTabOptions(settings),
      ...(typeof options.dataset === 'string' && datasets.includes(options.dataset)
        ? {dataset: options.dataset}
        : {}),
      ...(apiVersion ? {apiVersion} : {}),
      ...('perspective' in options ? {perspective: sanitizePerspective(options.perspective)} : {}),
      ...(typeof options.includeSourceMap === 'boolean'
        ? {includeSourceMap: options.includeSourceMap}
        : {}),
    },
  })
}

function sanitizeSidebar(value: unknown): VistaSidebarState {
  if (!isPlainObject(value)) {
    return {expanded: false, drawer: null}
  }
  return {
    expanded: value.expanded === true,
    drawer: value.drawer === 'saved' || value.drawer === 'shared' ? value.drawer : null,
  }
}

/** A panel stays expanded unless it was explicitly collapsed; state saved before panels existed reads as expanded */
function sanitizePanels(value: unknown): VistaPanelsState {
  const panels = isPlainObject(value) ? value : {}
  return {params: panels.params !== false, options: panels.options !== false}
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

  const settings = sanitizeSettings(stored.settings, initial.settings, defaults.datasets)
  const tabs = (Array.isArray(stored.tabs) ? stored.tabs : [])
    .map((tab) => sanitizeTab(tab, settings, defaults.datasets))
    .filter((tab): tab is VistaTab => tab !== null)

  const sidebar = sanitizeSidebar(stored.sidebar)
  const panels = sanitizePanels(stored.panels)
  if (tabs.length === 0) {
    return {...initial, settings, sidebar, panels}
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
  }
}

export function saveVistaState(projectId: string, state: VistaPersistedState): void {
  try {
    getStorage()?.setItem(getVistaStorageKey(projectId), JSON.stringify(state))
  } catch {
    // Quota exceeded: the session keeps working, it just will not be restored
  }
}

export function clearVistaState(projectId: string): void {
  getStorage()?.removeItem(getVistaStorageKey(projectId))
}
