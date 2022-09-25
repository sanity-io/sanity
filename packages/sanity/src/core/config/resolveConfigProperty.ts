import {ConfigPropertyError} from './ConfigPropertyError'
import {PluginOptions, ConfigPropertyReducer, AsyncConfigPropertyReducer} from './types'

const flattenConfig = (
  {plugins = [], ...currentConfig}: PluginOptions,
  path: string[]
): Array<{config: PluginOptions; path: string[]}> => {
  return [
    {config: currentConfig, path: [...path, currentConfig.name]},
    ...plugins.flatMap((config) => flattenConfig(config, [...path, currentConfig.name])),
  ]
}

interface ResolveConfigPropertyOptions<TValue, TContext> {
  propertyName: string
  config: PluginOptions
  context: TContext
  initialValue: TValue
  reducer: ConfigPropertyReducer<TValue, TContext>
}
interface AsyncResolveConfigPropertyOptions<TValue, TContext> {
  propertyName: string
  config: PluginOptions
  context: TContext
  initialValue: TValue
  asyncReducer: AsyncConfigPropertyReducer<TValue, TContext>
}

export function resolveConfigProperty<TValue, TContext>(
  options: ResolveConfigPropertyOptions<TValue, TContext>
): TValue
export function resolveConfigProperty<TValue, TContext>(
  options: AsyncResolveConfigPropertyOptions<TValue, TContext>
): Promise<TValue>
export function resolveConfigProperty<TValue, TContext>({
  config: inputConfig,
  context,
  initialValue,
  propertyName,
  ...reducers
}:
  | ResolveConfigPropertyOptions<TValue, TContext>
  | AsyncResolveConfigPropertyOptions<TValue, TContext>): TValue | Promise<TValue> {
  const configs = flattenConfig(inputConfig, [])

  if ('reducer' in reducers) {
    return configs.reduce((acc, {config, path}) => {
      try {
        return reducers.reducer(acc, config, context)
      } catch (e) {
        throw new ConfigPropertyError({
          propertyName,
          path: path,
          cause: e,
        })
      }
    }, initialValue)
  }

  const reducer = reducers.asyncReducer
  return (async () => {
    let current = initialValue
    for (const {config, path} of configs) {
      try {
        current = await reducer(current, config, context)
      } catch (e) {
        throw new ConfigPropertyError({
          propertyName,
          path,
          cause: e,
        })
      }
    }
    return current
  })()
}
