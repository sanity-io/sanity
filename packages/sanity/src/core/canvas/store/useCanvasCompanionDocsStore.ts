import {useMemo} from 'react'

import {useClient} from '../../hooks/useClient'
import {useDocumentPreviewStore} from '../../store/_legacy/datastores'
import {useResourceCache} from '../../store/_legacy/ResourceCacheProvider'
import {useWorkspace} from '../../studio/workspace'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../studioClient'
import {
  type CanvasCompanionDocsStore,
  createCanvasCompanionDocsStore,
} from './createCanvasCompanionDocsStore'

export function useCanvasCompanionDocsStore(): CanvasCompanionDocsStore {
  const resourceCache = useResourceCache()
  const workspace = useWorkspace()
  const previewStore = useDocumentPreviewStore()
  const studioClient = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  return useMemo(() => {
    const releaseStore =
      resourceCache.get<CanvasCompanionDocsStore>({
        dependencies: [workspace, previewStore],
        namespace: 'CompanionDocsStore',
      }) ||
      createCanvasCompanionDocsStore({
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
