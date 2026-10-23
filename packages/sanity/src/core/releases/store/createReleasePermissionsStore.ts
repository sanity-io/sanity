import {type SingleActionResult} from '@sanity/client'

import {isInsufficientPermissionsError} from '../../variants/store/variantActionErrors'
import {type useReleasePermissionsValue} from './useReleasePermissions'

const DRY_RUN_OPTIONS = {dryRun: true, skipCrossDatasetReferenceValidation: true}

async function dryRun(
  action: (...args: any[]) => Promise<void | SingleActionResult>,
  args: unknown[],
): Promise<boolean> {
  try {
    await action(...args, DRY_RUN_OPTIONS)
    return true
  } catch (error) {
    return !isInsufficientPermissionsError(error)
  }
}

/**
 * Store that contains if the user has permissions to perform a release action
 * And a guardrail to dry run requests to check if the user has permissions
 *
 * @returns an object with the following properties:
 * * checkWithPermissionGuard - a function that checks if the user has permissions to perform a release action by adding dryRun properties
 * * permissions - an object with the permissions for each action, filled in as the checks settle
 *
 * @internal
 */
export function createReleasePermissionsStore(
  isContentReleasesEnabled: boolean,
): useReleasePermissionsValue {
  const permissions: {[key: string]: boolean} = {}
  const checks = new Map<string, Promise<boolean>>()

  /**
   * Checks if a release action can be performed by running a dry run of the given action.
   * Only a permission error resolves false, so any other error surfaces from the real request.
   *
   * @param action - any of the actions from the {@link ReleaseOperationStore}, e.g. publishRelease should send in also the needed props
   * @param args - the arguments to pass to the action (release id, etc)
   * @returns true or false depending if the user can perform the action
   */
  const checkWithPermissionGuard = <
    T extends (...args: any[]) => Promise<void | SingleActionResult>,
  >(
    action: T,
    ...args: Parameters<T>
  ): Promise<boolean> => {
    if (!isContentReleasesEnabled) {
      /**
       * When content releases feature flag is disabled
       * assume allowed permissions to provide upsell
       */
      return Promise.resolve(true)
    }

    const cached = checks.get(action.name)
    if (cached) return cached

    const check = dryRun(action, args).then((allowed) => {
      permissions[action.name] = allowed
      return allowed
    })
    checks.set(action.name, check)

    return check
  }

  return {
    checkWithPermissionGuard,
    permissions,
  }
}
