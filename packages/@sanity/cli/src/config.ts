import type {CliConfig} from './types'

/** @beta */
export function defineCliConfig(config: CliConfig): CliConfig {
  return config
}

/**
 * @deprecated Use `defineCliConfig` instead
 * @beta
 */
export function createCliConfig(config: CliConfig): CliConfig {
  return config
}
