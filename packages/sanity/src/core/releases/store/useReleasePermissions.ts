export interface useReleasePermissionsValue {
  checkWithPermissionGuard: <T extends (...args: any[]) => Promise<void> | void>(
    action: T,
    ...args: Parameters<T>
  ) => Promise<boolean>
}

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
      return false
    }
  }
  return {
    checkWithPermissionGuard: checkWithPermissionGuard,
  }
}
