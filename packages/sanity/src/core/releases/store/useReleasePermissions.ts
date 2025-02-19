import {useMemo} from 'react'

import {isErrorWithDetails} from '../../error/types/isErrorWithDetails'
import {useResourceCache} from '../../store/_legacy/ResourceCacheProvider'

export interface useReleasePermissionsValue {
  checkWithPermissionGuard: <T extends (...args: any[]) => Promise<void> | void>(
    action: T,
    ...args: Parameters<T>
  ) => Promise<boolean>
  permissions: {[key: string]: boolean}
}

type ReleasePermissionError = {details: {type: 'insufficientPermissionsError'}}

const RELEASE_PERMISSIONS_RESOURCE_CACHE_NAMESPACE = 'ReleasePermissions'

export const isReleasePermissionError = (error: unknown): error is ReleasePermissionError =>
  isErrorWithDetails(error) && error.details?.type === 'insufficientPermissionsError'

/**
 *
 * @internal
 */
function createReleasePermissionsStore(): useReleasePermissionsValue {
  let permissions: {[key: string]: boolean} = {}

  /**
   * Checks if a release action can be performed by running a dry run of the given action
   *
   * @param action - any of the actions from the ReleaseOperationStore, e.g. publishRelease should send in also the needed props
   * @param args - the arguments to pass to the action (release id, etc)
   * @returns true or false depending if the user can perform the action
   */
  const checkWithPermissionGuard = async <T extends (...args: any[]) => Promise<void> | void>(
    action: T,
    ...args: Parameters<T>
  ): Promise<boolean> => {
    if (permissions[action.name] === undefined) {
      try {
        await action(...args, {
          dryRun: true,
          skipCrossDatasetReferenceValidation: true,
        })
        permissions = {...permissions, [action.name]: true}

        return true
      } catch (e) {
        permissions = {...permissions, [action.name]: false}

        return !isReleasePermissionError(e)
      }
    } else {
      return permissions[action.name]
    }
  }
  return {
    checkWithPermissionGuard: checkWithPermissionGuard,
    permissions,
  }
}

/**
 * @internal
 */
export function useReleasePermissions(): useReleasePermissionsValue {
  const resourceCache = useResourceCache()

  return useMemo(() => {
    const releasePermissionsStore =
      resourceCache.get<useReleasePermissionsValue>({
        dependencies: [null],
        namespace: RELEASE_PERMISSIONS_RESOURCE_CACHE_NAMESPACE,
      }) || createReleasePermissionsStore()

    resourceCache.set({
      namespace: RELEASE_PERMISSIONS_RESOURCE_CACHE_NAMESPACE,
      value: releasePermissionsStore,
      dependencies: [null],
    })

    return releasePermissionsStore
  }, [resourceCache])
}
