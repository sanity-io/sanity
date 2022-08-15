import {ItemProps, RenderItemCallback} from '../../form'
import {defaultRenderItem} from '../../form/studio/defaults'
import {PluginOptions, SourceOptions} from '../types'
import {_RenderMiddleware} from './_types'

function _collectMiddleware(
  middlewares: _RenderMiddleware<ItemProps, RenderItemCallback>[],
  plugins: PluginOptions[]
) {
  for (const plugin of plugins) {
    // Recursive
    if (plugin.plugins) {
      _collectMiddleware(middlewares, plugin.plugins)
    }

    if (plugin.form?.renderItem) {
      middlewares.push(plugin.form?.renderItem)
    }
  }
}

/**
 * @internal
 */
export function _createRenderItem(config: SourceOptions): RenderItemCallback {
  return (props) => {
    const middlewares: _RenderMiddleware<ItemProps, RenderItemCallback>[] = []

    if (config.plugins) {
      _collectMiddleware(middlewares, config.plugins)
    }

    if (config.form?.renderItem) {
      middlewares.push(config.form?.renderItem)
    }

    // Initialize the callback chain
    let next = defaultRenderItem

    for (const middleware of middlewares) {
      const defaultRender = next

      next = (itemProps: ItemProps) => {
        return middleware(itemProps, defaultRender) || defaultRender(itemProps)
      }
    }

    return next(props)
  }
}
