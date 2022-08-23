import {SchemaType} from '@sanity/types'
import {DiffProps} from '../../field'
import {RenderDiffCallback} from '../../form'
import {defaultRenderDiff} from '../../form/studio/defaults'
import {PluginOptions, SourceOptions} from '../types'
import {_RenderMiddleware} from './_types'

function _collectMiddleware(
  middlewares: _RenderMiddleware<DiffProps & {schemaType: SchemaType}, RenderDiffCallback>[],
  plugins: PluginOptions[]
) {
  for (const plugin of plugins) {
    // Recursive
    if (plugin.plugins) {
      _collectMiddleware(middlewares, plugin.plugins)
    }

    if (plugin.form?.renderDiff) {
      middlewares.push(plugin.form?.renderDiff)
    }
  }
}

/**
 * @internal
 */
export function _createRenderDiff(config: SourceOptions): RenderDiffCallback {
  return (props) => {
    const middlewares: _RenderMiddleware<
      DiffProps & {schemaType: SchemaType},
      RenderDiffCallback
    >[] = []

    if (config.plugins) {
      _collectMiddleware(middlewares, config.plugins)
    }

    if (config.form?.renderDiff) {
      middlewares.push(config.form?.renderDiff)
    }

    // Initialize the callback chain
    let next = defaultRenderDiff

    for (const middleware of middlewares) {
      const defaultRender = next

      next = (diffProps: DiffProps & {schemaType: SchemaType}) => {
        return middleware(diffProps, defaultRender) || defaultRender(diffProps)
      }
    }

    return next(props)
  }
}
