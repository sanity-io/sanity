import {useCallback, useMemo} from 'react'
import {useObservable} from 'react-rx'

import {useClient} from '../../hooks'
import {useResourceCache} from '../../store'
import {RELEASES_STUDIO_CLIENT_OPTIONS} from '../util/releasesClient'
import {
  createReleaseSettingsStore,
  INITIAL_RELEASE_SETTINGS_STATE,
  type ReleaseDescriptionSection,
  type ReleaseSettingsStore,
} from './createReleaseSettingsStore'
import {
  RELEASE_SETTINGS_DOCUMENT_ID,
  RELEASE_SETTINGS_DOCUMENT_TYPE,
} from './releaseSettingsConstants'

const NAMESPACE = 'ReleaseSettingsStore'
const EMPTY_SECTIONS: ReleaseDescriptionSection[] = []

/**
 * @internal
 */
export interface UseReleaseSettingsResult {
  descriptionSections: ReleaseDescriptionSection[]
  loading: boolean
  error: Error | null
  setDescriptionSections: (sections: ReleaseDescriptionSection[]) => Promise<void>
}

/**
 * Writes use `createOrReplace` so the document is materialised on first save —
 * the singleton doesn't exist in the dataset until someone saves settings.
 * @internal
 */
export function useReleaseSettings(): UseReleaseSettingsResult {
  const studioClient = useClient(RELEASES_STUDIO_CLIENT_OPTIONS)
  const resourceCache = useResourceCache()

  const store = useMemo<ReleaseSettingsStore>(() => {
    const cached = resourceCache.get<ReleaseSettingsStore>({
      dependencies: [studioClient],
      namespace: NAMESPACE,
    })
    if (cached) return cached
    const fresh = createReleaseSettingsStore({client: studioClient})
    resourceCache.set({
      dependencies: [studioClient],
      namespace: NAMESPACE,
      value: fresh,
    })
    return fresh
  }, [resourceCache, studioClient])

  const state = useObservable(store.state$, INITIAL_RELEASE_SETTINGS_STATE)

  const setDescriptionSections = useCallback(
    async (sections: ReleaseDescriptionSection[]) => {
      await studioClient.createOrReplace({
        _id: RELEASE_SETTINGS_DOCUMENT_ID,
        _type: RELEASE_SETTINGS_DOCUMENT_TYPE,
        descriptionSections: sections,
      })
    },
    [studioClient],
  )

  return {
    descriptionSections: state.document?.descriptionSections ?? EMPTY_SECTIONS,
    loading: state.loading,
    error: state.error,
    setDescriptionSections,
  }
}
