import {FieldProps, RenderFieldCallback} from '../../form'
import {defaultRenderField} from '../../form/studio/defaults'
import {PluginOptions, SourceOptions} from '../types'
import {_RenderMiddleware} from './_types'

function _collectMiddleware(
  middlewares: _RenderMiddleware<FieldProps, RenderFieldCallback>[],
  plugins: PluginOptions[]
) {
  for (const plugin of plugins) {
    // Recursive
    if (plugin.plugins) {
      _collectMiddleware(middlewares, plugin.plugins)
    }

    if (plugin.form?.renderField) {
      middlewares.push(plugin.form?.renderField)
    }
  }
}

/**
 * @internal
 */
export function _createRenderField(config: SourceOptions): RenderFieldCallback {
  return (props) => {
    const middlewares: _RenderMiddleware<FieldProps, RenderFieldCallback>[] = []

    if (config.plugins) {
      _collectMiddleware(middlewares, config.plugins)
    }

    if (config.form?.renderField) {
      middlewares.push(config.form?.renderField)
    }

    // Initialize the callback chain
    let next = defaultRenderField

    for (const middleware of middlewares) {
      const defaultRender = next

      next = (fieldProps: FieldProps) => {
        return middleware(fieldProps, defaultRender) || defaultRender(fieldProps)
      }
    }

    return next(props)
  }
}
