import {SchemaType} from '@sanity/types'
import {PreviewProps} from '../../components/previews'
import {RenderPreviewCallback} from '../../form'
import {defaultRenderPreview} from '../../form/studio/defaults'
import {SourceOptions} from '../types'
import {_RenderMiddleware} from './_types'

/**
 * @internal
 */
export function _createRenderPreview(config: SourceOptions): RenderPreviewCallback {
  return (props) => {
    const middlewares: _RenderMiddleware<
      PreviewProps & {schemaType: SchemaType},
      RenderPreviewCallback
    >[] = []

    if (config.plugins) {
      for (const plugin of config.plugins) {
        if (plugin.form?.renderPreview) {
          middlewares.push(plugin.form?.renderPreview)
        }
      }
    }

    if (config.form?.renderPreview) {
      middlewares.push(config.form?.renderPreview)
    }

    // Initialize the callback chain
    let next = defaultRenderPreview

    for (const middleware of middlewares) {
      const defaultRender = next

      next = (previewProps: PreviewProps & {schemaType: SchemaType}) => {
        return middleware(previewProps, defaultRender) || defaultRender(previewProps)
      }
    }

    return next(props)
  }
}
