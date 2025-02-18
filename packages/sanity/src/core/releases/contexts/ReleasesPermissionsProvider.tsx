import {useState} from 'react'

import {isErrorWithDetails} from '../../error/types/isErrorWithDetails'
import {ReleasesPermissionsContext} from './ReleasesPermissionContext'

type ReleasePermissionError = {details: {type: 'insufficientPermissionsError'}}

export const isReleasePermissionError = (error: unknown): error is ReleasePermissionError =>
  isErrorWithDetails(error) && error.details?.type === 'insufficientPermissionsError'

export const ReleasesPermissionsProvider = ({children}: {children: React.ReactNode}) => {
  const [permissions, setPermissions] = useState<Record<string, boolean>>({})

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
    if (action.name in permissions) {
      return permissions[action.name]
    }

    try {
      await action(...args, {
        dryRun: true,
        skipCrossDatasetReferenceValidation: true,
      })
      setPermissions({...permissions, [action.name]: true})
      return true
    } catch (e) {
      setPermissions({...permissions, [action.name]: false})

      return !isReleasePermissionError(e)
    }
  }

  const context = {
    checkWithPermissionGuard: checkWithPermissionGuard,
    permissions: permissions,
  }
  // Avoid mounting the provider if it's already provided by a parent
  return (
    <ReleasesPermissionsContext.Provider value={context}>
      {children}
    </ReleasesPermissionsContext.Provider>
  )
}
