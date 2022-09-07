import React, {createElement, ReactNode} from 'react'
import {StudioLayout} from '../../studio'
import {Navbar, ToolMenu, DefaultLogo} from '../../studio/components'
import {_RenderMiddleware} from '../form/_types'
import {PluginOptions, RenderComponentCallback, SourceOptions} from '../types'

const DEFAULT_COMPONENTS: Record<ComponentNames, React.ElementType> = {
  Layout: StudioLayout,
  Logo: DefaultLogo,
  Navbar: Navbar,
  ToolMenu: ToolMenu,
}

const RENDER_CALLBACK_NAMES: Record<ComponentNames, RenderCallbackNames> = {
  Layout: 'renderLayout',
  Logo: 'renderLogo',
  Navbar: 'renderNavbar',
  ToolMenu: 'renderToolMenu',
}

type ComponentNames = 'Layout' | 'Logo' | 'Navbar' | 'ToolMenu'

type RenderCallbackNames = 'renderLayout' | 'renderLogo' | 'renderNavbar' | 'renderToolMenu'

type MiddlewaresType<T> = _RenderMiddleware<T, RenderComponentCallback<T>>[]

interface CreateRenderComponentProps {
  componentName: ComponentNames
  config: SourceOptions
}

function _collectMiddleware<T>(
  middlewares: MiddlewaresType<T>,
  plugins: PluginOptions[],
  renderCallbackName: RenderCallbackNames
) {
  for (const plugin of plugins) {
    if (plugin.plugins) {
      _collectMiddleware(middlewares, plugin.plugins, renderCallbackName)
    }

    if (plugin.studio?.[renderCallbackName]) {
      middlewares.push(plugin.studio[renderCallbackName] as RenderComponentCallback<T>)
    }
  }
}

/**
 * @internal
 */
export function _createRenderComponent<T>({
  componentName,
  config,
}: CreateRenderComponentProps): RenderComponentCallback<T> {
  return (props) => {
    const middlewares: MiddlewaresType<T> = []

    const renderCallbackName = RENDER_CALLBACK_NAMES[componentName]

    if (config.plugins) {
      _collectMiddleware(middlewares, config.plugins, renderCallbackName)
    }

    if (config.studio?.[renderCallbackName]) {
      middlewares.push(config.studio[renderCallbackName] as RenderComponentCallback<T>)
    }

    const _defaultItem = (itemProps: T): ReactNode =>
      createElement(DEFAULT_COMPONENTS[componentName], itemProps)

    let next = _defaultItem

    for (const middleware of middlewares) {
      const defaultRender = next

      next = (itemProps: T) => {
        return middleware(itemProps, defaultRender) || defaultRender(itemProps)
      }
    }

    return next(props)
  }
}
