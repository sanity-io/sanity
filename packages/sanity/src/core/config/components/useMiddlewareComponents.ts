/* eslint-disable @typescript-eslint/ban-types */

import {ComponentType, createElement, Fragment, useMemo} from 'react'
import {useSource} from '../../studio'
import {PluginOptions} from '../types'

const emptyRender = () => createElement(Fragment)

function _createMiddlewareComponent<T extends {}>(
  defaultComponent: ComponentType<T>,
  middlewareComponents: ComponentType<T>[]
): ComponentType<T> {
  return (outerProps: T) => {
    // This is the inner "layer" of the middleware chain
    // Here we render the _default_ component (typically Sanity's component)
    let next = (props: T) => createElement(defaultComponent, props)

    // Since the middleware array is actually a middleware _stack_ data structure, we are
    // essentially looping backwards here. This makes it possible to define the _next_ layer for
    // each layer.
    for (const middleware of middlewareComponents) {
      // As we progress through the chain, the meaning of "renderDefault" changes.
      // At a given layer in the chain, the _next_ layer is the "default".
      const renderDefault = next

      // Here we replace `next` so that the _previous_ layer may use this as its _next_.
      next = (props) => createElement(middleware, {...props, renderDefault})
    }

    return next({
      ...outerProps,
      // NOTE: it's safe to pass the empty render function, since it'll be overwritten in the next step (above).
      // NOTE: it's important that the default component does not use `renderDefault`, since it will
      // get the `emptyRender` callback will be passed when the middleware stack is empty.
      renderDefault: emptyRender,
    })
  }
}

function _collectPluginValues<T>(
  middleware: T[],
  plugins: PluginOptions[],
  pick: (p: PluginOptions) => T | undefined
): void {
  for (const plugin of plugins) {
    const value = pick(plugin)

    if (value) {
      middleware.push(value)
    }

    if (plugin.plugins) {
      _collectPluginValues(middleware, plugin.plugins, pick)
    }
  }
}

function _pickFromPluginOptions<T>(
  plugin: PluginOptions,
  pick: (p: PluginOptions) => T | undefined
): T[] {
  const _middleware: T[] = []

  _collectPluginValues(_middleware, [plugin], pick)

  return _middleware
}

/** @internal */
export function useMiddlewareComponents<T extends {}>(props: {
  pick: (plugin: PluginOptions) => ComponentType<T>
  defaultComponent: ComponentType<T>
}): ComponentType<T> {
  const {options} = useSource().__internal
  const {defaultComponent, pick} = props

  const middlewareComponents = useMemo(() => {
    return _pickFromPluginOptions(options, pick)
  }, [options, pick])

  return useMemo(
    () => _createMiddlewareComponent(defaultComponent, middlewareComponents),
    [defaultComponent, middlewareComponents]
  )
}
