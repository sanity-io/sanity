import {useMemo} from 'react'

import {useClient} from '../../hooks'
import {useDocumentPreviewStore, useResourceCache} from '../../store'
import {useWorkspace} from '../../studio'
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
