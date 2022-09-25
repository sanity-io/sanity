import {useMemo} from 'react'
import {LoadableState, useLoadable} from '../../../../../util'
import {checkModuleStatus} from './moduleStatus'
import {CheckModuleVersionsOptions, ModuleStatusResponse} from './types'

/**
 * Retrieve whether or not the installed (or passed) `@sanity`-modules are up
 * to date and/or supported, and if they are outdated; which versions are is
 * the latest available on npm vs which ones are installed locally.
 *
 * @param options - Options to use for resolving module status
 * @internal Not a stable API yet
 */
export function useModuleStatus(
  options: CheckModuleVersionsOptions
): LoadableState<ModuleStatusResponse | undefined> {
  const moduleStatus$ = useMemo(() => checkModuleStatus(options), [options])

  return useLoadable(moduleStatus$)
}
