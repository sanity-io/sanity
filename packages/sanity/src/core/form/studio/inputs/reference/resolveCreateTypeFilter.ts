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
 * Resolves the creationTypeFilter callback from schema options to determine which
 * document types can be created from a reference field.
 *
 * This function safely executes the user-defined creationTypeFilter callback and
 * handles various error scenarios by falling back to all available types.
 *
 * When the filter returns an empty array [], this is treated as a valid result
 * that hides the "Create new" button entirely, allowing conditional disabling of
 * document creation based on the current document state.
 *
 * @param options - Configuration including schema type, document, and field path
 * @returns Array of ReferenceTypeOption objects representing types available for creation
 *
 * @internal
 */
export function resolveCreateTypeFilter(
  options: ResolveCreateTypeFilterOptions,
): ReferenceTypeOption[] {
  const {schemaType, document, valuePath} = options
  const availableTypes = schemaType.to.map((refType) => refType.name)
  const toTypes: ReferenceTypeOption[] = availableTypes.map((type) => ({type}))
  const filterFn = schemaType.options?.creationTypeFilter

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
      console.error('[sanity] creationTypeFilter must return an array, falling back to all types')
      return toTypes
    }

    // If filter intentionally returned empty array, respect it (hides create button)
    if (filteredResult.length === 0) {
      return []
    }

    const validTypes = filteredResult.filter((item) => {
      if (!item || typeof item !== 'object' || !('type' in item)) {
        console.error(
          '[sanity] creationTypeFilter returned invalid object without type property:',
          item,
        )
        return false
      }
      return availableTypes.includes(item.type)
    })

    // If all items were invalid, fall back to all types (error scenario)
    return validTypes.length > 0 ? validTypes : toTypes
  } catch (error) {
    console.error(
      '[sanity] Error in reference creationTypeFilter function, falling back to all types:',
      error,
    )
    return toTypes
  }
}
