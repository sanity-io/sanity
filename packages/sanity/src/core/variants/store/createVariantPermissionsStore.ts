import {type BaseActionOptions, type SingleActionResult} from '@sanity/client'

import {isInsufficientPermissionsError} from './variantActionErrors'

/** @internal */
export interface VariantPermissionsStore {
  /**
   * Finds out whether the current user may perform a variant operation by running it as a
   * `dryRun` — the same guard the releases tool uses. Resolves `false` only when the server
   * refuses with an insufficient-permissions error; any other outcome (success, or an
   * unrelated error such as the definition still holding documents) resolves `true`, so the
   * real request can surface that error itself.
   *
   * Grants for variant definitions are the same for every definition, so the result is cached
   * per operation for the lifetime of the store, and concurrent checks share one request.
   */
  checkWithPermissionGuard: <T extends (...args: any[]) => Promise<void | SingleActionResult>>(
    action: T,
    ...args: Parameters<T>
  ) => Promise<boolean>
}

const DRY_RUN_OPTIONS: BaseActionOptions = {dryRun: true, skipCrossDatasetReferenceValidation: true}

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

/** @internal */
export function createVariantPermissionsStore(): VariantPermissionsStore {
  const permissions = new Map<string, Promise<boolean>>()

  const checkWithPermissionGuard = <
    T extends (...args: any[]) => Promise<void | SingleActionResult>,
  >(
    action: T,
    ...args: Parameters<T>
  ): Promise<boolean> => {
    const cached = permissions.get(action.name)
    if (cached) return cached

    const check = dryRun(action, args)
    permissions.set(action.name, check)

    return check
  }

  return {checkWithPermissionGuard}
}
