import {isErrorWithDetails} from '../../error/types/isErrorWithDetails'
import {type useReleasePermissionsValue} from './useReleasePermissions'

type ReleasePermissionError = {details: {type: 'insufficientPermissionsError'}}

/**
 * Checks if the error is a permission error
 *
 * @param error - the error to check
 * @returns true if the error is a permission error
 */
export const isReleasePermissionError = (error: unknown): error is ReleasePermissionError =>
  isErrorWithDetails(error) && error.details?.type === 'insufficientPermissionsError'

/**
 * Store that contains if the user has permissions to perform a release action
 * And a guardrail to dry run requests to check if the user has permissions
 *
 * @returns an object with the following properties:
 * * checkWithPermissionGuard - a function that checks if the user has permissions to perform a release action by adding dryRun properties
 * * permissions - an object with the permissions for each action
 *
 * @internal
 */
export function createReleasePermissionsStore(
  isContentReleasesEnabled: boolean,
): useReleasePermissionsValue {
  let permissions: {[key: string]: boolean} = {}

  /**
   * Checks if a release action can be performed by running a dry run of the given action
   *
   * @param action - any of the actions from the {@link ReleaseOperationStore}, e.g. publishRelease should send in also the needed props
   * @param args - the arguments to pass to the action (release id, etc)
   * @returns true or false depending if the user can perform the action
   */
  const checkWithPermissionGuard = async <T extends (...args: any[]) => Promise<void> | void>(
    action: T,
    ...args: Parameters<T>
  ): Promise<boolean> => {
    if (!isContentReleasesEnabled) {
      /**
       * When content releases feature flag is disabled
       * assume allowed permissions to provide upsell
       */
      return true
    }

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
