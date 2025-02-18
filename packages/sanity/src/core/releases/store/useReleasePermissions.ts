import {useContext} from 'react'

import {
  type ReleasePermissionsValue,
  ReleasesPermissionsContext,
} from '../contexts/ReleasesPermissionContext'

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
