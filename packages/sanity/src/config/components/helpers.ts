import {ComponentType, createElement, useMemo} from 'react'
import {useSource} from '../../studio'
import {PluginOptions} from '../types'

interface MiddlewareProps<T> {
  renderDefault: (props: T) => React.ReactElement
}

export function createMiddlewareComponent<
  T extends {renderDefault: (props: T) => React.ReactElement}
>(middlewareComponents: ComponentType<T>[]): ComponentType<T> {
  return (_props: T) => {
    const _defaultItem = (props: T) => createElement(middlewareComponents[0], props)

    let next = _defaultItem

    for (const middleware of middlewareComponents.slice(1)) {
      const defaultRender = next

      next = (props) => {
        return createElement(middleware, {
          ...props,
          renderDefault: defaultRender,
        })
      }
    }

    return next(_props)
  }
}

function useMiddlewareComponent<T extends MiddlewareProps<T>>(
  middlewareComponents: ComponentType<T>[]
): ComponentType<T> {
  return useMemo(() => createMiddlewareComponent(middlewareComponents), [middlewareComponents])
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

export function useMiddlewareComponents<T extends MiddlewareProps<T>>(props: {
  pick: (plugin: PluginOptions) => ComponentType<T> | undefined
  defaultComponent: ComponentType<T>
}): ComponentType<T> {
  const {options} = useSource().__internal
  const {defaultComponent, pick} = props

  const middlewareComponents: ComponentType<T>[] = useMemo(() => {
    const middleware = _pickFromPluginOptions(options, pick)

    return [defaultComponent, ...middleware]
  }, [defaultComponent, options, pick])

  return useMiddlewareComponent(middlewareComponents)
}
