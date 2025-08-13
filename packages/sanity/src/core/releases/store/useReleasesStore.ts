import {useMemo} from 'react'

import {useClient} from '../../hooks/useClient'
import {useDocumentPreviewStore} from '../../store/_legacy/datastores'
import {useResourceCache} from '../../store/_legacy/ResourceCacheProvider'
import {useWorkspace} from '../../studio/workspace'
import {RELEASES_STUDIO_CLIENT_OPTIONS} from '../util/releasesClient'
import {createReleaseStore} from './createReleaseStore'
import {type ReleaseStore} from './types'

/** @internal */
export function useReleasesStore(): ReleaseStore {
  const resourceCache = useResourceCache()
  const workspace = useWorkspace()
  const previewStore = useDocumentPreviewStore()
  const studioClient = useClient(RELEASES_STUDIO_CLIENT_OPTIONS)

  return useMemo(() => {
    const releaseStore =
      resourceCache.get<ReleaseStore>({
        dependencies: [workspace, previewStore],
        namespace: 'ReleasesStore',
      }) ||
      createReleaseStore({
        client: studioClient,
        previewStore,
      })

    resourceCache.set({
      dependencies: [workspace, previewStore],
      namespace: 'ReleasesStore',
      value: releaseStore,
    })

    return releaseStore
  }, [resourceCache, workspace, studioClient, previewStore])
}
