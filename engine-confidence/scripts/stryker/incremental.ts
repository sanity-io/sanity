import {type StrykerRunMeta} from './report'

export type RunModeDecision =
  | {mode: 'incremental'}
  | {
      mode: 'full'
      reason: 'requested' | 'no-previous-run' | 'config-version-changed' | 'config-hash-changed'
    }

/**
 * Stryker reuses a verdict when the mutant's source and its covering tests are unchanged, so a
 * previous run only counts when it was measured with the exact pinned config.
 */
export function decideRunMode(options: {
  full: boolean
  previousMeta: StrykerRunMeta | undefined
  configVersion: number
  configHash: string
}): RunModeDecision {
  const {full, previousMeta, configVersion, configHash} = options
  if (full) return {mode: 'full', reason: 'requested'}
  if (previousMeta === undefined) return {mode: 'full', reason: 'no-previous-run'}
  if (previousMeta.configVersion === configVersion) {
    return previousMeta.configHash === configHash
      ? {mode: 'incremental'}
      : {mode: 'full', reason: 'config-hash-changed'}
  }
  return {mode: 'full', reason: 'config-version-changed'}
}
