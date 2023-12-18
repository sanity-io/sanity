/* eslint-disable @typescript-eslint/ban-types */
import {ComponentType, createElement, Fragment, useMemo} from 'react'
import {useSource} from '../../studio'
import {flattenConfig} from '../../config'
import {PluginOptions} from '../types'

const emptyRender = () => createElement(Fragment)

function _createMiddlewareComponent<T extends {}>(
  defaultComponent: ComponentType<T>,
  middlewareComponents: ComponentType<T>[],
): ComponentType<T> {
  return (outerProps: T) => {
    // This is the inner "layer" of the middleware chain
    // Here we render the _default_ component (typically Sanity's component)
    let next = (props: T) => createElement(defaultComponent, props)

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

/**
 * @internal
 * This hook returns a component based on the Components API middleware chain.
 *
 * - The `pick` function is used to select a component from the provided plugin options in the configuration.
 * - The `defaultComponent` is the default component that gets rendered with `renderDefault`.
 *   The `renderDefault` function is added to the props of the middleware components so that they can render the default
 *   component and continue the middleware chain.
 *
 * @example
 * Example usage of:
 *
 * ```ts
 *  const StudioLayout = useMiddlewareComponents({
 *   pick: (plugin) => plugin.studio?.components?.layout,
 *   defaultComponent: StudioLayout,
 *  })
 *
 * return <StudioLayout />
 *```
 */
export function useMiddlewareComponents<T extends {}>(props: {
  pick: (plugin: PluginOptions) => ComponentType<T>
  defaultComponent: ComponentType<T>
}): ComponentType<T> {
  const {options} = useSource().__internal
  const {defaultComponent, pick} = props

  return useMemo(() => {
    // Flatten the config tree into a list of configs
    const flattened = [...flattenConfig(options, [])]

    // Since the middleware chain is executed backwards, we need to reverse the list of configs here.
    // This is important because we want the order of the Components API to be consistent with the order of the other APIs.
    flattened.reverse()

    // Pick the middleware components from the configs
    const pickedComponents = flattened.map(({config}) => pick(config))

    // Since we try to pick the components in all configs, some results may be undefined.
    // Therefore, we filter these values out before passing the result to the middleware creator.
    const result = pickedComponents.filter(Boolean)

    // Create the middleware component
    return _createMiddlewareComponent(defaultComponent, result)
  }, [defaultComponent, options, pick])
}
