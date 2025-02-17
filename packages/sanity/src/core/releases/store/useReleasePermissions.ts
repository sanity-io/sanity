import {isErrorWithDetails} from '../../error/types/isErrorWithDetails'

export interface useReleasePermissionsValue {
  checkWithPermissionGuard: <T extends (...args: any[]) => Promise<void> | void>(
    action: T,
    ...args: Parameters<T>
  ) => Promise<boolean>
}

type ReleasePermissionError = {details: {type: 'insufficientPermissionsError'}}

export const isReleasePermissionError = (error: unknown): error is ReleasePermissionError =>
  isErrorWithDetails(error) && error.details?.type === 'insufficientPermissionsError'

/**
 * @internal
 */
export function useReleasePermissions(): useReleasePermissionsValue {
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
    try {
      await action(...args, {
        dryRun: true,
        skipCrossDatasetReferenceValidation: true,
      })
      return true
    } catch (e) {
      return !isReleasePermissionError(e)
    }
  }
  return {
    checkWithPermissionGuard: checkWithPermissionGuard,
  }
}
