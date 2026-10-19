import {type AssetSource, type SchemaAssetSources} from '@sanity/types'

/**
 * Resolve a field's `options.sources` against the asset sources configured on
 * the Studio. Without the schema option the configured list passes through
 * untouched; with it the field gets exactly what the option selects —
 * `AssetSource` objects as-is, `string` entries matched on `AssetSource.name`
 * (unknown names dropped with a warning), or the configured list filtered by
 * a predicate (see {@link SchemaAssetSources} for when each form fits).
 *
 * @internal
 */
export function resolveSchemaAssetSources(
  sourcesFromSchema: SchemaAssetSources | undefined,
  configuredSources: AssetSource[],
): AssetSource[] {
  if (!sourcesFromSchema) {
    return configuredSources
  }
  if (typeof sourcesFromSchema === 'function') {
    return configuredSources.filter((source) => sourcesFromSchema(source))
  }
  return sourcesFromSchema.flatMap((entry) => {
    if (typeof entry !== 'string') {
      return [entry]
    }
    const named = configuredSources.find((source) => source.name === entry)
    if (!named) {
      console.warn(
        `Field \`options.sources\` names the asset source '${entry}', but no configured asset source has that name (configured: ${
          configuredSources.map((source) => `'${source.name}'`).join(', ') || 'none'
        })`,
      )
      return []
    }
    return [named]
  })
}
