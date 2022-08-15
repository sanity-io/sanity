import {InputProps, RenderInputCallback} from '../../form'
import {defaultRenderInput} from '../../form/studio/defaults'
import {PluginOptions, SourceOptions} from '../types'
import {_RenderMiddleware} from './_types'

function _collectMiddleware(
  middlewares: _RenderMiddleware<InputProps, RenderInputCallback>[],
  plugins: PluginOptions[]
) {
  for (const plugin of plugins) {
    // Recursive
    if (plugin.plugins) {
      _collectMiddleware(middlewares, plugin.plugins)
    }

    if (plugin.form?.renderInput) {
      middlewares.push(plugin.form?.renderInput)
    }
  }
}

/**
 * @internal
 */
export function _createRenderInput(config: SourceOptions): RenderInputCallback {
  return (props) => {
    const middlewares: _RenderMiddleware<InputProps, RenderInputCallback>[] = []

    if (config.plugins) {
      _collectMiddleware(middlewares, config.plugins)
    }

    if (config.form?.renderInput) {
      middlewares.push(config.form?.renderInput)
    }

    // Initialize the callback chain
    let next = defaultRenderInput

    for (const middleware of middlewares) {
      const defaultRender = next

      next = (inputProps: InputProps) => {
        return middleware(inputProps, defaultRender) || defaultRender(inputProps)
      }
    }

    return next(props)
  }
}
