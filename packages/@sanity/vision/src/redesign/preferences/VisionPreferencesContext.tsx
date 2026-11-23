import {useSanityInstance} from '@sanity/sdk-react'
import {createContext, use, useMemo, useSyncExternalStore} from 'react'
import {useCurrentUser} from 'sanity'

import {
  createSdkPreferenceAdapter,
  createVisionPreferences,
  type VisionPreferenceName,
  type VisionPreferences,
} from './visionPreferences'

export const VisionPreferencesContext = createContext<VisionPreferences | null>(null)

/** The preferences of the signed-in user, through the Studio's App SDK instance */
export function useCreateVisionPreferences(projectId: string): VisionPreferences {
  const instance = useSanityInstance()
  const userId = useCurrentUser()?.id
  return useMemo(
    () =>
      createVisionPreferences({
        projectId,
        sdk: userId ? createSdkPreferenceAdapter(instance, userId) : null,
      }),
    [instance, projectId, userId],
  )
}

export function useVisionPreferences(): VisionPreferences {
  const preferences = use(VisionPreferencesContext)
  if (!preferences) {
    throw new Error('useVisionPreferences must be used within a VisionPreferencesContext provider')
  }
  return preferences
}

/** The stored value, as stored: validate it before use */
export function useVisionPreference(
  preferences: VisionPreferences,
  name: VisionPreferenceName,
): unknown {
  return useSyncExternalStore(preferences.subscribe, () => preferences.get(name))
}

export function useVisionPreferencesReady(preferences: VisionPreferences): boolean {
  return useSyncExternalStore(preferences.subscribe, preferences.isReady)
}
