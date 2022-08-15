import {SchemaType} from '@sanity/types'
import {PreviewProps} from '../../components/previews'
import {RenderPreviewCallback} from '../../form'
import {defaultRenderPreview} from '../../form/studio/defaults'
import {PluginOptions, SourceOptions} from '../types'
import {_RenderMiddleware} from './_types'

function _collectMiddleware(
  middlewares: _RenderMiddleware<PreviewProps & {schemaType: SchemaType}, RenderPreviewCallback>[],
  plugins: PluginOptions[]
) {
  for (const plugin of plugins) {
    // Recursive
    if (plugin.plugins) {
      _collectMiddleware(middlewares, plugin.plugins)
    }

    if (plugin.form?.renderPreview) {
      middlewares.push(plugin.form?.renderPreview)
    }
  }
}

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
      _collectMiddleware(middlewares, config.plugins)
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
