/* eslint-disable func-name-matching */
import React, {ComponentType, createElement} from 'react'
import {RenderInputCallback} from '../../../form'
import {
  defaultRenderInput,
  defaultRenderField,
  defaultRenderItem,
  defaultRenderPreview,
} from '../../../form/studio/defaults'
import {PluginOptions, SourceOptions} from '../../types'
import {CallbackNames, ComponentNames} from './types'

type FIXME = any

const RENDER_CALLBACK_NAMES: Record<ComponentNames, CallbackNames> = {
  Input: 'renderInput',
  Field: 'renderField',
  Item: 'renderItem',
  Preview: 'renderPreview',
}

const DEFAULT_RENDER: Record<ComponentNames, RenderInputCallback<FIXME>> = {
  Input: defaultRenderInput,
  Field: defaultRenderField,
  Item: defaultRenderItem,
  Preview: defaultRenderPreview,
}

function _collectMiddleware<T>(
  middlewares: ComponentType<T>[],
  plugins: PluginOptions[],
  componentName: ComponentNames
) {
  for (const plugin of plugins) {
    const component = plugin.form?.components?.[componentName]

    if (component) {
      middlewares.push(component as ComponentType<T>)
    }

    if (plugin.plugins) {
      _collectMiddleware(middlewares, plugin.plugins, componentName)
    }
  }
}

const FN_CACHE = new WeakMap<FIXME, string>()

/** @internal */
export function _createRenderFormComponent<T>({
  config,
  componentName,
}: {
  config: SourceOptions
  componentName: ComponentNames
}): ComponentType<T> {
  const middlewares: React.ComponentType<T>[] = []

  const component = config.form?.components?.[componentName]

  if (component) {
    middlewares.push(component as ComponentType<any>)
  }

  _collectMiddleware(middlewares, config?.plugins || [], componentName)

  const renderCallbackName = RENDER_CALLBACK_NAMES[componentName]
  const defaultRender = DEFAULT_RENDER[componentName]

  const __ROOT__ = function __ROOT__(props: FIXME) {
    FN_CACHE.set(__ROOT__, props.id)

    function __DEFAULT__(p: FIXME): React.ReactNode {
      FN_CACHE.set(__DEFAULT__, p.id)

      if (props.id !== p.id) return __ROOT__(p)

      // NOTE: here we are only passing `renderInput` to `ObjectInput` and `ArrayInput`
      // and NOT to the next middleware.
      return defaultRender({
        ...p,
        [renderCallbackName]: p?.__internalCustomRender || p?.[renderCallbackName],
      })
    }

    let next = __DEFAULT__

    for (const c of middlewares) {
      const _next = next

      next = function __MIDDLEWARE__(p: FIXME) {
        FN_CACHE.set(__MIDDLEWARE__, p.id)

        if (props.id !== p.id) return __ROOT__(p)

        const __internalCustomRender = FN_CACHE.has(p?.[renderCallbackName])
          ? p.__internalCustomRender
          : p?.[renderCallbackName]

        return createElement(c as React.ComponentType, {
          ...p,
          __internalCustomRender,
          [renderCallbackName]: _next,
        })
      }
    }

    return next(props)
  }

  return function RootComponent(p) {
    return <>{__ROOT__(p)}</>
  }
}
