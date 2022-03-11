import {SanityConfig} from './types'

const EMPTY_RECORD: Record<string, unknown> = {}

export function createConfig(config: SanityConfig = EMPTY_RECORD): SanityConfig {
  // @todo: validation

  return config
}
