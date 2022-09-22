import React, {ComponentType, createElement} from 'react'
import {StudioLayout} from '../../../studio'
import {StudioLogo, StudioNavbar, StudioToolMenu} from '../../../studio/components'
import {PluginOptions, SourceOptions} from '../../types'
import {RenderComponentCallbackNames, StudioComponentNames} from './types'

const DEFAULT_COMPONENTS: Record<StudioComponentNames, React.ElementType> = {
  Layout: StudioLayout,
  Logo: StudioLogo,
  Navbar: StudioNavbar,
  ToolMenu: StudioToolMenu,
}

const RENDER_CALLBACK_NAMES: Record<StudioComponentNames, RenderComponentCallbackNames> = {
  Layout: 'renderLayout',
  Logo: 'renderLogo',
  Navbar: 'renderNavbar',
  ToolMenu: 'renderToolMenu',
}

interface CreateRenderComponentProps {
  componentName: StudioComponentNames
  config: SourceOptions
}

function _collectMiddleware<T>(
  middlewares: ComponentType<T>[],
  plugins: PluginOptions[],
  componentName: StudioComponentNames
) {
  for (const plugin of plugins) {
    if (plugin.plugins) {
      _collectMiddleware(middlewares, plugin.plugins, componentName)
    }

    const component = plugin.studio?.components?.[componentName]

    if (component) {
      middlewares.push(component as ComponentType<any>)
    }
  }
}

/**
 * @internal
 */
export function _createRenderStudioComponent<T>({
  componentName,
  config,
}: CreateRenderComponentProps): ComponentType<T> {
  return (props) => {
    const middlewares: ComponentType<T>[] = []

    const renderCallbackName = String([RENDER_CALLBACK_NAMES[componentName]])
    const component = config.studio?.components?.[componentName]

    if (component) {
      middlewares.push(component as ComponentType<any>)
    }

    if (config.plugins) {
      _collectMiddleware(middlewares, config.plugins, componentName)
    }

    const _defaultItem = (itemProps: T) =>
      createElement(DEFAULT_COMPONENTS[componentName], itemProps)

    let next = _defaultItem

    for (const middleware of middlewares) {
      const defaultRender = next

      next = (itemProps) => {
        return createElement(middleware as ComponentType<any>, {
          ...itemProps,
          [renderCallbackName]: defaultRender,
        })
      }
    }

    return next(props)
  }
}
