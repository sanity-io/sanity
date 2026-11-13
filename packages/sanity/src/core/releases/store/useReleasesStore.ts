import {useMemo} from 'react'

import {useClient} from '../../hooks/useClient'
import {useGlobalListenerStore} from '../../store/datastores'
import {useResourceCache} from '../../store/ResourceCacheProvider'
import {useWorkspace} from '../../studio/workspace'
import {RELEASES_STUDIO_CLIENT_OPTIONS} from '../util/releasesClient'
import {createReleaseStore} from './createReleaseStore'
import {type ReleaseStore} from './types'

/** @internal */
export function useReleasesStore(): ReleaseStore {
  const resourceCache = useResourceCache()
  const workspace = useWorkspace()
  const globalListenerStore = useGlobalListenerStore()
  const studioClient = useClient(RELEASES_STUDIO_CLIENT_OPTIONS)

  return useMemo(() => {
    const releaseStore =
      resourceCache.get<ReleaseStore>({
        dependencies: [workspace, globalListenerStore],
        namespace: 'ReleasesStore',
      }) ||
      createReleaseStore({
        client: studioClient,
        globalListenerStore,
      })

    resourceCache.set({
      dependencies: [workspace, globalListenerStore],
      namespace: 'ReleasesStore',
      value: releaseStore,
    })

    return releaseStore
  }, [resourceCache, workspace, studioClient, globalListenerStore])
}
