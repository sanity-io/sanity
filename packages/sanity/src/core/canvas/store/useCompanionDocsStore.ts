import {useMemo} from 'react'

import {useClient} from '../../hooks/useClient'
import {useDocumentPreviewStore} from '../../store/_legacy/datastores'
import {useResourceCache} from '../../store/_legacy/ResourceCacheProvider'
import {useWorkspace} from '../../studio/workspace'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../studioClient'
import {type CompanionDocsStore, createCompanionDocsStore} from './createCompanionDocsStore'

export function useCompanionDocsStore(): CompanionDocsStore {
  const resourceCache = useResourceCache()
  const workspace = useWorkspace()
  const previewStore = useDocumentPreviewStore()
  const studioClient = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  return useMemo(() => {
    const releaseStore =
      resourceCache.get<CompanionDocsStore>({
        dependencies: [workspace, previewStore],
        namespace: 'CompanionDocsStore',
      }) ||
      createCompanionDocsStore({
        client: studioClient,
        previewStore,
      })

    resourceCache.set({
      dependencies: [workspace, previewStore],
      namespace: 'CompanionDocsStore',
      value: releaseStore,
    })

    return releaseStore
  }, [resourceCache, workspace, studioClient, previewStore])
}
