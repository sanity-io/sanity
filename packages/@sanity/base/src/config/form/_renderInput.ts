import {InputProps, RenderInputCallback} from '../../form'
import {defaultRenderInput} from '../../form/studio/defaults'
import {SourceOptions} from '../types'
import {_RenderMiddleware} from './_types'

/**
 * @internal
 */
export function _createRenderInput(config: SourceOptions): RenderInputCallback {
  return (props) => {
    const middlewares: _RenderMiddleware<InputProps, RenderInputCallback>[] = []

    if (config.plugins) {
      for (const plugin of config.plugins) {
        if (plugin.form?.renderInput) {
          middlewares.push(plugin.form?.renderInput)
        }
      }
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
