import {useMemo} from 'react'

import {useFeatureEnabled} from '../../hooks/useFeatureEnabled'
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
  const contentReleasesFeature = useFeatureEnabled('contentReleases')

  return useMemo(() => {
    const releasePermissionsStore =
      resourceCache.get<useReleasePermissionsValue>({
        dependencies: [contentReleasesFeature],
        namespace: RELEASE_PERMISSIONS_RESOURCE_CACHE_NAMESPACE,
      }) || createReleasePermissionsStore(contentReleasesFeature.enabled)

    resourceCache.set({
      namespace: RELEASE_PERMISSIONS_RESOURCE_CACHE_NAMESPACE,
      value: releasePermissionsStore,
      dependencies: [contentReleasesFeature],
    })

    return releasePermissionsStore
  }, [contentReleasesFeature, resourceCache])
}
