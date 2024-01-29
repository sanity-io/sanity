import {SchemaTypeDefinition} from '@sanity/types'
import {ConfigPropertyReducer, PluginOptions} from './types'
import {schemaTypesReducer} from './configPropertyReducers'
import {resolveConfigProperty} from './resolveConfigProperty'

type ConfigContext<T> = T extends ConfigPropertyReducer<any, infer TContext> ? TContext : never
type SchemaTypeContext = ConfigContext<typeof schemaTypesReducer>

interface ResolveSchemaTypesOptions {
  config: PluginOptions
  context: SchemaTypeContext
}

/**
 * @internal
 * @hidden
 */
export function resolveSchemaTypes({
  config,
  context,
}: ResolveSchemaTypesOptions): SchemaTypeDefinition[] {
  return resolveConfigProperty({
    propertyName: 'schema.types',
    config,
    context,
    initialValue: [],
    reducer: schemaTypesReducer,
  })
}
