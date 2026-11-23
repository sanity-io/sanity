import {PreferenceError} from '@sanity/sdk'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {clearLocalStorage} from '../../util/localStorage'
import {
  createVisionPreferences,
  getLocalPreferenceKey,
  type PreferenceSdk,
  VISION_PREFERENCE_KEYS,
  type VisionPreferenceName,
} from './visionPreferences'

const PROJECT_ID = 'prefs-project'

interface FakeEntry {
  snapshot: {
    status: 'pending' | 'success' | 'error'
    data?: {value: unknown; isDefault: boolean}
    error?: unknown
  }
  listeners: Set<() => void>
}

/**
 * Behaves like the App SDK as far as Vision relies on it: reading a key it does not declare
 * throws `keyNotDeclared` from `getCurrent`, writes apply optimistically
 */
function createFakeSdk(declared: VisionPreferenceName[]) {
  const declaredKeys = new Set<string>(declared.map((name) => VISION_PREFERENCE_KEYS[name]))
  const entries = new Map<string, FakeEntry>()
  const entryFor = (key: string): FakeEntry => {
    let entry = entries.get(key)
    if (!entry) {
      entry = {snapshot: {status: 'pending'}, listeners: new Set()}
      entries.set(key, entry)
    }
    return entry
  }
  const emit = (key: string, snapshot: FakeEntry['snapshot']) => {
    const entry = entryFor(key)
    entry.snapshot = snapshot
    entry.listeners.forEach((listener) => listener())
  }
  const notDeclared = (key: string) =>
    new PreferenceError('keyNotDeclared', `Unknown preference key "${key}"`)

  const updateError = {current: undefined as unknown}
  const sdk: PreferenceSdk = {
    getState: (key) => ({
      getCurrent: () => {
        if (!declaredKeys.has(key)) throw notDeclared(key)
        return entryFor(key).snapshot
      },
      subscribe: (listener) => {
        const entry = entryFor(key)
        entry.listeners.add(listener)
        return () => entry.listeners.delete(listener)
      },
    }),
    update: vi.fn(async (key: string, value: unknown) => {
      if (!declaredKeys.has(key)) throw notDeclared(key)
      if (updateError.current) throw updateError.current
      emit(key, {status: 'success', data: {value, isDefault: false}})
    }),
  }

  return {
    sdk,
    updateError,
    /** The API answers for a key */
    answer: (name: VisionPreferenceName, value: unknown, isDefault = false) =>
      emit(VISION_PREFERENCE_KEYS[name], {status: 'success', data: {value, isDefault}}),
    /** The SDK declares the key, the API does not know it */
    reject: (name: VisionPreferenceName) =>
      emit(VISION_PREFERENCE_KEYS[name], {
        status: 'error',
        error: notDeclared(VISION_PREFERENCE_KEYS[name]),
      }),
    answerAll: (except: VisionPreferenceName[] = []) => {
      for (const name of declared) {
        if (!except.includes(name)) {
          emit(VISION_PREFERENCE_KEYS[name], {
            status: 'success',
            data: {value: undefined, isDefault: true},
          })
        }
      }
    },
  }
}

function readLocal(name: VisionPreferenceName): unknown {
  return JSON.parse(localStorage.getItem(getLocalPreferenceKey(name, PROJECT_ID)) || 'null')
}

describe('createVisionPreferences', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('without the SDK', () => {
    it('stores each preference in localStorage, under its own key', () => {
      const preferences = createVisionPreferences({projectId: PROJECT_ID, sdk: null})
      expect(preferences.isReady()).toBe(true)
      expect(preferences.get('settings')).toBeUndefined()

      preferences.set('redesign', true)
      preferences.set('layout', {sidebarExpanded: true})

      expect(readLocal('redesign')).toBe(true)
      expect(readLocal('layout')).toEqual({sidebarExpanded: true})
      expect(localStorage.getItem(getLocalPreferenceKey('redesign', 'other-project'))).toBeNull()
      // A new store, as on the next visit, reads them back
      const next = createVisionPreferences({projectId: PROJECT_ID, sdk: null})
      expect(next.get('redesign')).toBe(true)
      expect(next.get('layout')).toEqual({sidebarExpanded: true})
    })

    it('notifies subscribers and keeps returning the same value object', () => {
      const preferences = createVisionPreferences({projectId: PROJECT_ID, sdk: null})
      const listener = vi.fn()
      const unsubscribe = preferences.subscribe(listener)

      preferences.set('settings', {ai: {enabled: false}})
      expect(listener).toHaveBeenCalledTimes(1)
      expect(preferences.get('settings')).toBe(preferences.get('settings'))

      unsubscribe()
      preferences.set('settings', {ai: {enabled: true}})
      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('reads the opt-in and the dismissal where earlier releases stored them', () => {
      localStorage.setItem(
        `sanityVision:redesign:${PROJECT_ID}`,
        JSON.stringify({optedIn: true, dismissed: true}),
      )
      const preferences = createVisionPreferences({projectId: PROJECT_ID, sdk: null})
      expect(preferences.get('redesign')).toBe(true)
      expect(preferences.get('redesignInvitation')).toBe(true)

      // A stored preference takes over from the old key
      preferences.set('redesign', false)
      expect(preferences.get('redesign')).toBe(false)
    })

    it('forgets what the error boundary clears', () => {
      const preferences = createVisionPreferences({projectId: PROJECT_ID, sdk: null})
      const listener = vi.fn()
      preferences.subscribe(listener)
      preferences.set('redesignInvitation', true)
      listener.mockClear()

      clearLocalStorage()

      expect(listener).toHaveBeenCalled()
      expect(preferences.get('redesignInvitation')).toBeUndefined()
    })
  })

  describe('with keys the SDK does not declare', () => {
    it('falls back to localStorage for every one of them', () => {
      const fake = createFakeSdk([])
      const preferences = createVisionPreferences({projectId: PROJECT_ID, sdk: fake.sdk})

      expect(preferences.isReady()).toBe(true)
      for (const name of Object.keys(VISION_PREFERENCE_KEYS) as VisionPreferenceName[]) {
        expect(preferences.source(name)).toBe('local')
      }

      preferences.set('settings', {ai: {explainQuery: false}})
      expect(fake.sdk.update).not.toHaveBeenCalled()
      expect(readLocal('settings')).toEqual({ai: {explainQuery: false}})
    })
  })

  describe('with keys the SDK declares', () => {
    it('waits for the API, then reads and writes through the SDK', async () => {
      const fake = createFakeSdk(['redesign', 'redesignInvitation', 'settings', 'layout'])
      const preferences = createVisionPreferences({projectId: PROJECT_ID, sdk: fake.sdk})
      const listener = vi.fn()
      preferences.subscribe(listener)

      expect(preferences.source('settings')).toBe('sdk')
      expect(preferences.isReady()).toBe(false)

      fake.answerAll(['redesign'])
      expect(preferences.isReady()).toBe(false)
      fake.answer('redesign', true)
      expect(preferences.isReady()).toBe(true)
      expect(preferences.get('redesign')).toBe(true)
      expect(listener).toHaveBeenCalled()

      preferences.set('layout', {sidebarExpanded: true})
      await vi.waitFor(() =>
        expect(fake.sdk.update).toHaveBeenCalledWith(VISION_PREFERENCE_KEYS.layout, {
          sidebarExpanded: true,
        }),
      )
      expect(preferences.get('layout')).toEqual({sidebarExpanded: true})
      expect(localStorage.getItem(getLocalPreferenceKey('layout', PROJECT_ID))).toBeNull()
    })

    it('applies a value stored in another browser', () => {
      const fake = createFakeSdk(['settings'])
      const preferences = createVisionPreferences({projectId: PROJECT_ID, sdk: fake.sdk})
      const listener = vi.fn()
      preferences.subscribe(listener)
      fake.answer('settings', {ai: {enabled: true}})
      listener.mockClear()

      fake.answer('settings', {ai: {enabled: false}})

      expect(listener).toHaveBeenCalledTimes(1)
      expect(preferences.get('settings')).toEqual({ai: {enabled: false}})
    })

    it('starts from the localStorage value while nobody stored one through the SDK', () => {
      localStorage.setItem(getLocalPreferenceKey('redesign', PROJECT_ID), 'true')
      const fake = createFakeSdk(['redesign'])
      const preferences = createVisionPreferences({projectId: PROJECT_ID, sdk: fake.sdk})
      preferences.subscribe(() => {})

      fake.answer('redesign', false, true)
      expect(preferences.get('redesign')).toBe(true)

      fake.answer('redesign', false)
      expect(preferences.get('redesign')).toBe(false)
    })

    it('falls back to localStorage when the API does not know the key', () => {
      localStorage.setItem(getLocalPreferenceKey('layout', PROJECT_ID), '{"sidebarExpanded":true}')
      const fake = createFakeSdk(['layout'])
      const preferences = createVisionPreferences({projectId: PROJECT_ID, sdk: fake.sdk})
      const listener = vi.fn()
      preferences.subscribe(listener)
      expect(preferences.source('layout')).toBe('sdk')

      fake.reject('layout')

      expect(listener).toHaveBeenCalled()
      expect(preferences.source('layout')).toBe('local')
      expect(preferences.get('layout')).toEqual({sidebarExpanded: true})
      preferences.set('layout', {sidebarExpanded: false})
      expect(readLocal('layout')).toEqual({sidebarExpanded: false})
    })

    it('stores the value in localStorage when the SDK rejects the write as undeclared', async () => {
      const fake = createFakeSdk(['redesignInvitation'])
      const preferences = createVisionPreferences({projectId: PROJECT_ID, sdk: fake.sdk})
      preferences.subscribe(() => {})
      fake.answer('redesignInvitation', false, true)
      vi.mocked(fake.sdk.update).mockRejectedValueOnce(
        new PreferenceError('keyNotDeclared', 'The preferences API does not know the key'),
      )

      preferences.set('redesignInvitation', true)

      await vi.waitFor(() => expect(readLocal('redesignInvitation')).toBe(true))
      expect(preferences.source('redesignInvitation')).toBe('local')
      expect(preferences.get('redesignInvitation')).toBe(true)
    })

    it('reports other failed writes without falling back', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      const fake = createFakeSdk(['settings'])
      fake.updateError.current = new PreferenceError('networkError', 'Offline')
      const preferences = createVisionPreferences({projectId: PROJECT_ID, sdk: fake.sdk})
      preferences.subscribe(() => {})

      preferences.set('settings', {ai: {enabled: false}})

      await vi.waitFor(() => expect(consoleError).toHaveBeenCalled())
      expect(preferences.source('settings')).toBe('sdk')
      expect(localStorage.getItem(getLocalPreferenceKey('settings', PROJECT_ID))).toBeNull()
    })
  })
})
