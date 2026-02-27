import {type Config} from './types'

/**
 * @hidden
 * @beta */
export function defineConfig<const T extends Config>(config: T): T {
  return config
}

/**
 * @deprecated Use `defineConfig` instead
 *
 * @hidden
 * @beta
 */
export function createConfig<const T extends Config>(config: T): T {
  return defineConfig(config)
}
