import {FieldProps, RenderFieldCallback} from '../../form'
import {defaultRenderField} from '../../form/studio/defaults'
import {SourceOptions} from '../types'
import {_RenderMiddleware} from './_types'

/**
 * @internal
 */
export function _createRenderField(config: SourceOptions): RenderFieldCallback {
  return (props) => {
    const middlewares: _RenderMiddleware<FieldProps, RenderFieldCallback>[] = []

    if (config.plugins) {
      for (const plugin of config.plugins) {
        if (plugin.form?.renderField) {
          middlewares.push(plugin.form?.renderField)
        }
      }
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
