import type {Config} from './types'

export function createConfig<T extends Config>(config: T): T {
  return config
}
