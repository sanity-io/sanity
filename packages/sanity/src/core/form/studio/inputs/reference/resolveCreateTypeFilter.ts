import {
  type Path,
  type ReferenceSchemaType,
  type ReferenceTypeFilterContext,
  type ReferenceTypeOption,
  type SanityDocument,
} from '@sanity/types'
import {get} from '@sanity/util/paths'

export interface ResolveCreateTypeFilterOptions {
  schemaType: ReferenceSchemaType
  document: SanityDocument
  valuePath: Path
}

/**
 * Resolves filterTypes from schema options using the ComposableOption pattern.
 * Falls back to all available types if: no filterTypes defined, execution throws,
 * returns empty array, returns invalid objects, or returns no valid types.
 *
 * @returns Array of ReferenceTypeOption objects with type names
 */
export function resolveCreateTypeFilter(
  options: ResolveCreateTypeFilterOptions,
): ReferenceTypeOption[] {
  const {schemaType, document, valuePath} = options
  const availableTypes = schemaType.to.map((refType) => refType.name)
  const toTypes: ReferenceTypeOption[] = availableTypes.map((type) => ({type}))
  const filterFn = schemaType.options?.filterTypes

  if (!filterFn) return toTypes

  const parentPath = valuePath.slice(0, -1)
  const context: ReferenceTypeFilterContext = {
    document,
    parent: get(document, parentPath),
    parentPath,
  }

  try {
    const filteredResult = filterFn(context, toTypes)

    if (!Array.isArray(filteredResult)) {
      console.error('[sanity] filterTypes must return an array, falling back to all types')
      return toTypes
    }

    if (!filteredResult.length) return toTypes

    const validTypes = filteredResult.filter((item) => {
      if (!item || typeof item !== 'object' || !('type' in item)) {
        console.error('[sanity] filterTypes returned invalid object without type property:', item)
        return false
      }
      return availableTypes.includes(item.type)
    })

    return validTypes.length > 0 ? validTypes : toTypes
  } catch (error) {
    console.error(
      '[sanity] Error in reference filterTypes function, falling back to all types:',
      error,
    )
    return toTypes
  }
}
