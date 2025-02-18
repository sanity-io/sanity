import {useContext} from 'react'

import {
  type ReleasePermissionsValue,
  ReleasesPermissionsContext,
} from '../../../_singletons/context/ReleasesPermissionContext'

/**
 * @internal
 */
export function useReleasePermissions(): ReleasePermissionsValue {
  const contextValue = useContext(ReleasesPermissionsContext)

  return (
    contextValue || {
      checkWithPermissionGuard: async () => false,
      permissions: {},
    }
  )
}
