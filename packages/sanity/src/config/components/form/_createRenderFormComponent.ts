import {ComponentType, createElement} from 'react'
import {
  defaultResolveFieldComponent,
  defaultResolveInputComponent,
  defaultResolveItemComponent,
  defaultResolvePreviewComponent,
} from '../../../form/studio/inputResolver/inputResolver'
import {PluginOptions, SourceOptions} from '../../types'
import {FormComponentNames} from './types'

const DEFAULT_RESOLVE_COMPONENT: Record<FormComponentNames, any> = {
  Field: defaultResolveFieldComponent,
  Input: defaultResolveInputComponent,
  Item: defaultResolveItemComponent,
  Preview: defaultResolvePreviewComponent,
}

interface CreateRenderComponentProps {
  componentName: FormComponentNames
  config: SourceOptions
}

function _collectMiddleware<T>(
  middlewares: ComponentType<T>[],
  plugins: PluginOptions[],
  componentName: FormComponentNames
) {
  for (const plugin of plugins) {
    if (plugin.plugins) {
      _collectMiddleware(middlewares, plugin.plugins, componentName)
    }

    const component = plugin.form?.components?.[componentName]

    if (component) {
      middlewares.push(component as ComponentType<any>)
    }
  }
}

/**
 * @internal
 */
export function _createRenderFormComponent<T>({
  componentName,
  config,
}: CreateRenderComponentProps): ComponentType<T> {
  return (props) => {
    const middlewares: ComponentType<T>[] = []
    const component = config.form?.components?.[componentName]

    if (component) {
      middlewares.push(component as ComponentType<any>)
    }

    if (config.plugins) {
      _collectMiddleware(middlewares, config.plugins, componentName)
    }

    const _defaultItem = (itemProps: T) => {
      const component1 = DEFAULT_RESOLVE_COMPONENT[componentName]((props as any).schemaType)

      return createElement(component1, {
        ...itemProps,
        renderNext: (p: any) => {
          const component2 = DEFAULT_RESOLVE_COMPONENT[componentName](p.schemaType.type)

          return createElement(component2, p)
        },
      })
    }

    let next = _defaultItem

    for (const middleware of middlewares) {
      const defaultRender = next

      next = (itemProps: T): any => {
        return createElement(middleware as ComponentType<any>, {
          ...itemProps,
          renderNext: defaultRender,
        })
      }
    }

    return next(props)
  }
}
