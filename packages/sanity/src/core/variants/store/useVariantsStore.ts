import {useMemo} from 'react'

import {useClient} from '../../hooks/useClient'
import {useGlobalListenerStore} from '../../store/datastores'
import {useResourceCache} from '../../store/ResourceCacheProvider'
import {useWorkspace} from '../../studio/workspace'
import {VARIANTS_STUDIO_CLIENT_OPTIONS} from './constants'
import {createVariantsStore, type VariantStore} from './createVariantsStore'

/** @internal */
export function useVariantsStore(): VariantStore {
  const workspace = useWorkspace()
  const variantsEnabled = Boolean(workspace.beta?.variants?.enabled)
  const resourceCache = useResourceCache()
  const studioClient = useClient(VARIANTS_STUDIO_CLIENT_OPTIONS)
  const globalListenerStore = useGlobalListenerStore()

  return useMemo(() => {
    const variantStore =
      resourceCache.get<VariantStore>({
        dependencies: [workspace, globalListenerStore],
        namespace: 'VariantsStore',
      }) ||
      createVariantsStore({
        client: studioClient,
        globalListenerStore,
        enabled: variantsEnabled,
      })

    resourceCache.set({
      dependencies: [workspace, globalListenerStore],
      namespace: 'VariantsStore',
      value: variantStore,
    })

    return variantStore
  }, [variantsEnabled, resourceCache, workspace, studioClient, globalListenerStore])
}
