import {type SystemVariant} from '../types'

/**
 * Metadata key under which a generated variant definition records the set it came from.
 * A "variant set" has no document of its own (yet) — it is reified as this shared reference
 * across every definition its generation produced, which is enough to group the children in
 * the overview and show lineage on the detail page.
 *
 * @internal
 */
export const VARIANT_SET_METADATA_KEY = 'variantSet'

/**
 * A back-reference from a generated variant definition to its parent set.
 *
 * @internal
 */
export interface VariantSetReference {
  id: string
  name: string
}

/**
 * Read the parent-set reference off a variant definition, or `undefined` if it wasn't generated
 * from a set (hand-built definitions, and definitions that have been forked off a set, carry no
 * reference).
 *
 * @internal
 */
export function getVariantSetReference(
  variant: Pick<SystemVariant, 'metadata'>,
): VariantSetReference | undefined {
  const reference = variant.metadata?.[VARIANT_SET_METADATA_KEY]

  if (
    typeof reference === 'object' &&
    reference !== null &&
    'id' in reference &&
    'name' in reference &&
    typeof reference.id === 'string' &&
    typeof reference.name === 'string'
  ) {
    return {id: reference.id, name: reference.name}
  }

  return undefined
}
