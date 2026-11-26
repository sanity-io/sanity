import isEqual from 'lodash-es/isEqual.js'
import {useLayoutEffect} from 'react'

import {selectStoredPreferences, type VisionActorRef} from '../store/visionMachine'
import {
  sanitizeStoredSettings,
  toStoredSettings,
  type VisionStorageDefaults,
} from '../store/visionStorage'
import {type VisionPreferences} from './visionPreferences'

const SYNCED_PREFERENCES = ['settings', 'layout'] as const

/**
 * Stores the settings and the layout as they change, and applies settings changed in another tab
 * or browser. A layout changed elsewhere applies the next time the tool opens: moving panels
 * around under the user's pointer would be more surprising than useful.
 */
export function useSyncVisionPreferences(
  actorRef: VisionActorRef,
  preferences: VisionPreferences,
  defaults: VisionStorageDefaults,
): void {
  // A layout effect, like `usePersistVisionState`, so a change made as the tool mounts is stored
  useLayoutEffect(() => {
    let previous = selectStoredPreferences(actorRef.getSnapshot())
    // Moves what releases up to this one kept with the tabs to the preferences
    for (const name of SYNCED_PREFERENCES) {
      if (preferences.get(name) === undefined) preferences.set(name, previous[name])
    }

    const subscription = actorRef.subscribe((snapshot) => {
      const next = selectStoredPreferences(snapshot)
      const changed = SYNCED_PREFERENCES.filter((name) => !isEqual(next[name], previous[name]))
      // Updated first, so the store's notification of the write reads as no change
      previous = next
      for (const name of changed) preferences.set(name, next[name])
    })
    const unsubscribe = preferences.subscribe(() => {
      const stored = preferences.get('settings')
      if (stored === undefined) return
      const settings = sanitizeStoredSettings(stored, defaults)
      const storedSettings = toStoredSettings(settings)
      if (isEqual(storedSettings, previous.settings)) return
      // Updated first, so the snapshot this event produces is not stored back
      previous = {...previous, settings: storedSettings}
      actorRef.send({type: 'preferences.sync', preferences: settings})
    })
    return () => {
      subscription.unsubscribe()
      unsubscribe()
    }
  }, [actorRef, defaults, preferences])
}
