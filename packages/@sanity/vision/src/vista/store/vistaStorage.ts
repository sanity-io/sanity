import {uuid} from '@sanity/uuid'

import {API_VERSIONS, DEFAULT_API_VERSION} from '../../apiVersions'
import {isSupportedPerspective, type SupportedPerspective} from '../../perspectives'
import {isPlainObject} from '../../util/isPlainObject'
import {prefixApiVersion} from '../../util/prefixApiVersion'
import {validateApiVersion} from '../../util/validateApiVersion'
import {
  type VistaPersistedState,
  type VistaSettings,
  type VistaSidebarState,
  type VistaTab,
  type VistaTabInit,
  type VistaTabOptions,
} from './types'

const KEY_PREFIX = 'sanityVista:'
const STATE_VERSION = 1

export const DEFAULT_PARAMS = '{\n  \n}'

export interface VistaStorageDefaults {
  datasets: string[]
  defaultDataset: string
  /** From the tool config, with or without the `v` prefix */
  defaultApiVersion: string
}

function getStorageKey(projectId: string): string {
  return `${KEY_PREFIX}${projectId}`
}

function getStorage(): Storage | undefined {
  try {
    const storage = globalThis.localStorage
    const probe = `${KEY_PREFIX}probe`
    storage.setItem(probe, probe)
    storage.removeItem(probe)
    return storage
  } catch {
    return undefined
  }
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
  const listed = API_VERSIONS.includes(settings.apiVersion)
  return {
    dataset: settings.dataset,
    apiVersion: listed ? settings.apiVersion : DEFAULT_API_VERSION,
    customApiVersion: listed ? false : settings.apiVersion,
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
    typeof options.apiVersion === 'string' && API_VERSIONS.includes(options.apiVersion)
      ? options.apiVersion
      : undefined
  const customApiVersion =
    typeof options.customApiVersion === 'string' ? options.customApiVersion : false

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
      customApiVersion,
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
    stored = JSON.parse(storage.getItem(getStorageKey(projectId)) || 'null')
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

  if (tabs.length === 0) {
    return {...initial, settings, sidebar: sanitizeSidebar(stored.sidebar)}
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
    sidebar: sanitizeSidebar(stored.sidebar),
  }
}

export function saveVistaState(projectId: string, state: VistaPersistedState): void {
  const storage = getStorage()
  if (!storage) {
    return
  }
  try {
    storage.setItem(getStorageKey(projectId), JSON.stringify(state))
  } catch {
    // Quota exceeded or storage disabled: the session keeps working, it just will not be restored
  }
}

export function clearVistaState(projectId: string): void {
  const storage = getStorage()
  storage?.removeItem(getStorageKey(projectId))
}

/** Removes every Vista namespace, for the error boundary's "clear cache" recovery path */
export function clearAllVistaState(): void {
  const storage = getStorage()
  if (!storage) {
    return
  }
  const keys: string[] = []
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)
    if (key?.startsWith(KEY_PREFIX)) {
      keys.push(key)
    }
  }
  keys.forEach((key) => storage.removeItem(key))
}
