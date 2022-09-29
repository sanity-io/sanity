import type {Config} from './types'

/** @beta */
export function createConfig<T extends Config>(config: T): T {
  return config
}
