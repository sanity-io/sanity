import {
  type PreferenceEdit,
  type PreferenceKey,
  PreferenceError,
  type SanityInstance,
  updateUserPreference,
  userPreference,
} from '@sanity/sdk'

import {isPlainObject} from '../../util/isPlainObject'
import {getStorage, onLocalStorageCleared, VISION_STORAGE_KEY_PREFIX} from '../../util/localStorage'

/**
 * Vision's durable preferences, each under its own key of the App SDK's preferences, which the
 * Studio keeps per user and project. Tabs and other workspace state stay in `localStorage` (see
 * `visionStorage`): they are not preferences, and are not shared across browsers.
 */
export const VISION_PREFERENCE_KEYS = {
  /** `true` once the user chose the redesigned Vision */
  redesign: 'studio.vision-tool.redesign',
  /** `true` once the user dismissed the invitation to try the redesign */
  redesignInvitation: 'studio.vision-tool.redesign-invitation-dismissed',
  /** The settings dialog: request defaults, hidden diff fields and AI feature switches */
  settings: 'studio.vision-tool.settings',
  /** Whether the sidebar and the collapsible panels are expanded, and the views they show */
  layout: 'studio.vision-tool.layout',
} as const

export type VisionPreferenceName = keyof typeof VISION_PREFERENCE_KEYS

const PREFERENCE_NAMES = Object.keys(VISION_PREFERENCE_KEYS) as VisionPreferenceName[]

/** Where a preference is read from and written to */
export type VisionPreferenceSource = 'sdk' | 'local'

/** What a preference snapshot from the SDK holds, as far as Vision reads it */
interface SdkPreferenceSnapshot {
  status: 'pending' | 'success' | 'error'
  data?: {value: unknown; isDefault: boolean}
  error?: unknown
}

/** The slice of the App SDK's preferences Vision uses */
export interface PreferenceSdk {
  /** Throws a `keyNotDeclared` error for a key the SDK does not declare */
  getState: (key: string) => {
    getCurrent: () => SdkPreferenceSnapshot
    subscribe: (listener: () => void) => () => void
  }
  update: (key: string, value: unknown) => Promise<unknown>
}

/** The SDK's user preferences for the signed-in user, on the Studio's SDK instance */
export function createSdkPreferenceAdapter(
  instance: SanityInstance,
  userId: string,
): PreferenceSdk {
  return {
    // Vision's keys are only typed once the SDK declares them; until then the SDK rejects them at
    // runtime, which is how the store finds out to keep them in `localStorage`
    getState: (key) => userPreference.getState(instance, userId, key as PreferenceKey),
    update: (key, value) =>
      updateUserPreference<PreferenceKey>(instance, {
        userId,
        key: key as PreferenceKey,
        value: value as PreferenceEdit<PreferenceKey>,
      }),
  }
}

function isKeyNotDeclared(error: unknown): boolean {
  // By name as well, as a studio can end up with a second copy of the SDK
  return (
    (error instanceof PreferenceError ||
      (error instanceof Error && error.name === 'PreferenceError')) &&
    (error as PreferenceError).code === 'keyNotDeclared'
  )
}

export interface VisionPreferences {
  /** The stored value, or `undefined` while nothing is stored (or the SDK is still reading it) */
  get: (name: VisionPreferenceName) => unknown
  /** `false` while the SDK has not answered for one of the preferences yet */
  isReady: () => boolean
  source: (name: VisionPreferenceName) => VisionPreferenceSource
  set: (name: VisionPreferenceName, value: unknown) => void
  subscribe: (listener: () => void) => () => void
}

export interface VisionPreferencesOptions {
  projectId: string
  /** `null` keeps every preference in `localStorage` */
  sdk: PreferenceSdk | null
}

/** Where releases up to this one kept the redesign opt-in and the invitation's dismissal */
function getLegacyRedesignKey(projectId: string): string {
  return `${VISION_STORAGE_KEY_PREFIX}redesign:${projectId}`
}

export function getLocalPreferenceKey(name: VisionPreferenceName, projectId: string): string {
  return `${VISION_STORAGE_KEY_PREFIX}preference:${name}:${projectId}`
}

function parse(raw: string | null): unknown {
  if (raw === null) return undefined
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return undefined
  }
}

interface PreferenceEntry {
  source: VisionPreferenceSource
  sdkState?: ReturnType<PreferenceSdk['getState']>
  unsubscribeSdk?: () => void
}

/**
 * Durable preferences through the App SDK, so they follow the user to other browsers. A key the
 * SDK does not declare yet is kept in `localStorage` instead, under Vision's prefix, until a
 * Studio with an SDK that declares it reads it from there and stores it at the first change. The
 * SDK's own caching, refetching and optimistic writes apply to the keys it declares.
 */
export function createVisionPreferences({
  projectId,
  sdk,
}: VisionPreferencesOptions): VisionPreferences {
  const listeners = new Set<() => void>()
  // Parsed per raw string, so a snapshot stays the same object while storage holds the same value
  const localCache = new Map<string, {raw: string | null; value: unknown}>()
  const memory = new Map<VisionPreferenceName, unknown>()
  const entries = new Map<VisionPreferenceName, PreferenceEntry>()

  const notify = () => listeners.forEach((listener) => listener())

  function fallBackToLocal(entry: PreferenceEntry) {
    entry.unsubscribeSdk?.()
    entry.source = 'local'
    entry.sdkState = undefined
    entry.unsubscribeSdk = undefined
  }

  /**
   * The SDK's snapshot, or `undefined` once the key fell back to `localStorage`. The SDK throws
   * `keyNotDeclared` when reading a key it does not declare, and reports it as the snapshot's error
   * when the API does not know a key the SDK declares.
   */
  function snapshot(entry: PreferenceEntry): SdkPreferenceSnapshot | undefined {
    if (!entry.sdkState) return undefined
    try {
      const current = entry.sdkState.getCurrent()
      if (!isKeyNotDeclared(current.error)) return current
    } catch (error) {
      if (!isKeyNotDeclared(error)) throw error
    }
    fallBackToLocal(entry)
    return undefined
  }

  function watchSdk(entry: PreferenceEntry) {
    if (!entry.sdkState || entry.unsubscribeSdk) return
    entry.unsubscribeSdk = entry.sdkState.subscribe(() => {
      snapshot(entry)
      notify()
    })
  }

  function entryFor(name: VisionPreferenceName): PreferenceEntry {
    const existing = entries.get(name)
    if (existing) return existing
    const entry: PreferenceEntry = sdk
      ? {source: 'sdk', sdkState: sdk.getState(VISION_PREFERENCE_KEYS[name])}
      : {source: 'local'}
    snapshot(entry)
    entries.set(name, entry)
    if (listeners.size > 0) watchSdk(entry)
    return entry
  }

  function readLegacy(name: VisionPreferenceName, storage: Storage): unknown {
    if (name !== 'redesign' && name !== 'redesignInvitation') return undefined
    const legacy = parse(storage.getItem(getLegacyRedesignKey(projectId)))
    if (!isPlainObject(legacy)) return undefined
    const value = name === 'redesign' ? legacy.optedIn : legacy.dismissed
    return value === true ? true : undefined
  }

  function readLocal(name: VisionPreferenceName): unknown {
    const storage = getStorage()
    if (!storage) return memory.get(name)
    const key = getLocalPreferenceKey(name, projectId)
    const raw = storage.getItem(key)
    const cached = localCache.get(key)
    if (cached && cached.raw === raw) return cached.value
    const value = raw === null ? readLegacy(name, storage) : parse(raw)
    localCache.set(key, {raw, value})
    return value
  }

  function writeLocal(name: VisionPreferenceName, value: unknown) {
    const storage = getStorage()
    if (!storage) {
      memory.set(name, value)
      return
    }
    const key = getLocalPreferenceKey(name, projectId)
    try {
      storage.setItem(key, JSON.stringify(value))
    } catch {
      // Quota exceeded: the change still applies until the tool unmounts
      localCache.set(key, {raw: storage.getItem(key), value})
      return
    }
    localCache.delete(key)
  }

  function get(name: VisionPreferenceName): unknown {
    const data = snapshot(entryFor(name))?.data
    if (data && !data.isDefault) return data.value
    // Also what a key the SDK has no value for yet starts from: the value kept before it declared it
    return readLocal(name)
  }

  function set(name: VisionPreferenceName, value: unknown) {
    const entry = entryFor(name)
    if (entry.source === 'local') {
      writeLocal(name, value)
      notify()
      return
    }
    sdk?.update(VISION_PREFERENCE_KEYS[name], value).catch((error: unknown) => {
      if (isKeyNotDeclared(error)) {
        fallBackToLocal(entry)
        writeLocal(name, value)
        notify()
        return
      }
      console.error(`Unable to store the Vision preference "${name}"`, error)
    })
  }

  return {
    get,
    set,
    source: (name) => entryFor(name).source,
    isReady: () => PREFERENCE_NAMES.every((name) => snapshot(entryFor(name))?.status !== 'pending'),
    subscribe: (listener) => {
      listeners.add(listener)
      for (const name of PREFERENCE_NAMES) watchSdk(entryFor(name))
      // The error boundary's "Clear cache" removes the values kept in `localStorage`
      const unsubscribeClear = onLocalStorageCleared(() => {
        localCache.clear()
        memory.clear()
        listener()
      })
      return () => {
        listeners.delete(listener)
        unsubscribeClear()
        if (listeners.size === 0) {
          entries.forEach((entry) => {
            entry.unsubscribeSdk?.()
            entry.unsubscribeSdk = undefined
          })
        }
      }
    },
  }
}
