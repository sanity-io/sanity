import {type Config} from './types'

/**
 * @hidden
 * @beta */
export function defineConfig<const T extends Config>(config: T): T {
  return config
}
