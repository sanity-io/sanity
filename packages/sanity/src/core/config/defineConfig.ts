import type {Config} from './types'

/** @beta */
export function defineConfig<T extends Config>(config: T): T {
  return config
}

/**
 * @deprecated Use `defineConfig` instead
 * @beta
 */
export function createConfig<T extends Config>(config: T): T {
  return defineConfig(config)
}
