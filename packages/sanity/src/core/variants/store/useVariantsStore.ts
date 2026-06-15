import {useMemo} from 'react'

import {useClient} from '../../hooks'
import {useResourceCache} from '../../store'
import {useWorkspace} from '../../studio'
import {VARIANTS_STUDIO_CLIENT_OPTIONS} from './constants'
import {createVariantsStore, type VariantStore} from './createVariantsStore'

/** @internal */
export function useVariantsStore(): VariantStore {
  const resourceCache = useResourceCache()
  const workspace = useWorkspace()
  const studioClient = useClient(VARIANTS_STUDIO_CLIENT_OPTIONS)

  return useMemo(() => {
    const variantStore =
      resourceCache.get<VariantStore>({
        dependencies: [workspace],
        namespace: 'VariantsStore',
      }) ||
      createVariantsStore({
        client: studioClient,
      })

    resourceCache.set({
      dependencies: [workspace],
      namespace: 'VariantsStore',
      value: variantStore,
    })

    return variantStore
  }, [resourceCache, workspace, studioClient])
}
