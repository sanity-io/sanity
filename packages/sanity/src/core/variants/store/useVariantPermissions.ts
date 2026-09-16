import {useMemo} from 'react'

import {useResourceCache} from '../../store/ResourceCacheProvider'
import {useWorkspace} from '../../studio/workspace'
import {
  createVariantPermissionsStore,
  type VariantPermissionsStore,
} from './createVariantPermissionsStore'

const VARIANT_PERMISSIONS_RESOURCE_CACHE_NAMESPACE = 'VariantPermissions'

/**
 * One permissions store per workspace, so dry-run results are shared by every variant menu
 * instead of being re-checked per row.
 *
 * @internal
 */
export function useVariantPermissions(): VariantPermissionsStore {
  const workspace = useWorkspace()
  const resourceCache = useResourceCache()

  return useMemo(() => {
    const permissionsStore =
      resourceCache.get<VariantPermissionsStore>({
        dependencies: [workspace],
        namespace: VARIANT_PERMISSIONS_RESOURCE_CACHE_NAMESPACE,
      }) || createVariantPermissionsStore()

    resourceCache.set({
      dependencies: [workspace],
      namespace: VARIANT_PERMISSIONS_RESOURCE_CACHE_NAMESPACE,
      value: permissionsStore,
    })

    return permissionsStore
  }, [resourceCache, workspace])
}
