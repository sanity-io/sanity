import {ItemProps, RenderItemCallback} from '../../form'
import {defaultRenderItem} from '../../form/studio/defaults'
import {SourceOptions} from '../types'
import {_RenderMiddleware} from './_types'

/**
 * @internal
 */
export function _createRenderItem(config: SourceOptions): RenderItemCallback {
  return (props) => {
    const middlewares: _RenderMiddleware<ItemProps, RenderItemCallback>[] = []

    if (config.plugins) {
      for (const plugin of config.plugins) {
        if (plugin.form?.renderItem) {
          middlewares.push(plugin.form?.renderItem)
        }
      }
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
