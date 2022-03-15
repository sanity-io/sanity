import {ResolvedSanityPlugin, SanityPlugin} from './types'

const EMPTY_ARRAY: never[] = []

export function resolvePlugin(plugin: SanityPlugin): ResolvedSanityPlugin {
  return {
    name: plugin.name,
    schemaTypes: plugin.schemaTypes || EMPTY_ARRAY,
    tools: plugin.tools || EMPTY_ARRAY,
  }
}

export function createPlugin(plugin: SanityPlugin): SanityPlugin {
  if (!plugin.name) {
    throw new Error('Plugin: missing `name` parameter')
  }

  if (typeof plugin.name !== 'string') {
    throw new Error('Plugin: the `name` must be a string')
  }

  return plugin
}
