import {useMemo} from 'react'

import {useResourceCache} from '../../store/_legacy/ResourceCacheProvider'
import {createReleasePermissionsStore} from './createReleasePermissionsStore'

const RELEASE_PERMISSIONS_RESOURCE_CACHE_NAMESPACE = 'ReleasePermissions'

export interface useReleasePermissionsValue {
  checkWithPermissionGuard: <T extends (...args: any[]) => Promise<void> | void>(
    action: T,
    ...args: Parameters<T>
  ) => Promise<boolean>
  permissions: {[key: string]: boolean}
}

/**
 * @internal
 */
export function useReleasePermissions(): useReleasePermissionsValue {
  const resourceCache = useResourceCache()

  return useMemo(() => {
    const releasePermissionsStore =
      resourceCache.get<useReleasePermissionsValue>({
        dependencies: [],
        namespace: RELEASE_PERMISSIONS_RESOURCE_CACHE_NAMESPACE,
      }) || createReleasePermissionsStore()

    resourceCache.set({
      namespace: RELEASE_PERMISSIONS_RESOURCE_CACHE_NAMESPACE,
      value: releasePermissionsStore,
      dependencies: [],
    })

    return releasePermissionsStore
  }, [resourceCache])
}
