import {isString} from 'lodash'
import {Plugin, PluginOptions} from './types'

/**
 * @hidden
 * @beta */
export type PluginFactory<TOptions> = (options: TOptions) => PluginOptions

function validatePlugin(pluginResult: PluginOptions) {
  // TODO: name is required etc
  const messages = [
    'projectId' in pluginResult && '`projectId` not allowed in plugin configuration',
    'dataset' in pluginResult && '`dataset` not allowed in plugin configuration',
  ].filter(isString)

  if (messages.length)
    throw new Error(
      `Invalid plugin configuration:\n${messages.map((message) => `\t${message}`).join('\n')}`,
    )
}

/**
 * @hidden
 * @beta */
export function definePlugin<TOptions = void>(
  arg: PluginFactory<TOptions> | PluginOptions,
): Plugin<TOptions> {
  if (typeof arg === 'function') {
    const pluginFactory = arg

    return (options: TOptions) => {
      // TODO: there's a possiblity of passing default arguments to users'
      // plugin factories or reading from default options in `TOptions`
      const result = pluginFactory(options)

      validatePlugin(result)
      return result
    }
  }

  validatePlugin(arg)
  return () => arg
}

/**
 * @deprecated Use `definePlugin` instead
 *
 * @hidden
 * @beta
 */
export function createPlugin<TOptions = void>(
  arg: PluginFactory<TOptions> | PluginOptions,
): Plugin<TOptions> {
  return definePlugin(arg)
}
