import {type EditableSystemVariant, type SystemVariant} from '../types'

/**
 * Metadata key under which a generated variant definition records the set it currently belongs to.
 * A "variant set" has no document of its own (yet) — it is reified as this shared reference across
 * every definition its generation produced, which is enough to group the children in the overview,
 * show lineage on the detail page, and reconstruct the set for editing.
 *
 * @internal
 */
export const VARIANT_SET_METADATA_KEY = 'variantSet'

/**
 * Metadata key under which a definition records the set it was *originally* generated from, after
 * being forked (edited on its own). It is no longer a member of the set — this is lineage only.
 *
 * @internal
 */
export const VARIANT_SET_FORKED_FROM_METADATA_KEY = 'forkedFromSet'

/**
 * A reference from a variant definition to a set — either current membership
 * ({@link VARIANT_SET_METADATA_KEY}) or fork origin ({@link VARIANT_SET_FORKED_FROM_METADATA_KEY}).
 *
 * @internal
 */
export interface VariantSetReference {
  id: string
  name: string
}

function readReference(
  variant: Pick<SystemVariant, 'metadata'>,
  key: string,
): VariantSetReference | undefined {
  const reference = variant.metadata?.[key]

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

/**
 * Read the parent-set reference off a variant definition, or `undefined` if it isn't a current
 * member of a set (hand-built definitions, and definitions forked off a set, carry no membership).
 *
 * @internal
 */
export function getVariantSetReference(
  variant: Pick<SystemVariant, 'metadata'>,
): VariantSetReference | undefined {
  return readReference(variant, VARIANT_SET_METADATA_KEY)
}

/**
 * Read the fork-origin reference off a variant definition, or `undefined` if it was never
 * generated from a set (or is still a member of one).
 *
 * @internal
 */
export function getForkedFromSetReference(
  variant: Pick<SystemVariant, 'metadata'>,
): VariantSetReference | undefined {
  return readReference(variant, VARIANT_SET_FORKED_FROM_METADATA_KEY)
}

/**
 * Detach a definition from its set: drop the active membership reference, leaving a clean
 * standalone definition. Used when a set is deleted but some members carry documents and must be
 * kept — stripping the reference removes them from the (now gone) set's overview group.
 *
 * @internal
 */
export function detachVariantFromSet(variant: SystemVariant): EditableSystemVariant {
  const nextMetadata = {...variant.metadata}
  delete nextMetadata[VARIANT_SET_METADATA_KEY]

  return {
    _id: variant._id,
    _type: variant._type,
    conditions: variant.conditions,
    priority: variant.priority,
    metadata: nextMetadata,
  }
}

function conditionsEqual(a: Record<string, string>, b: Record<string, string>): boolean {
  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)

  return aKeys.length === bKeys.length && aKeys.every((key) => a[key] === b[key])
}

/**
 * When a set member's *conditions* change, detach it from the set: drop the active membership and
 * record where it came from, so the edit can't drift the canonical set. Title/description edits
 * alone do not fork — they don't change the combination the set owns. Returns the edited variant
 * unchanged when it isn't a set member or its conditions are untouched.
 *
 * @internal
 */
export function forkVariantFromSetIfConditionsChanged(
  original: Pick<SystemVariant, 'metadata' | 'conditions'>,
  edited: EditableSystemVariant,
): EditableSystemVariant {
  const membership = getVariantSetReference(original)

  if (!membership || conditionsEqual(original.conditions, edited.conditions)) {
    return edited
  }

  const nextMetadata = {...edited.metadata}
  delete nextMetadata[VARIANT_SET_METADATA_KEY]
  nextMetadata[VARIANT_SET_FORKED_FROM_METADATA_KEY] = membership

  return {...edited, metadata: nextMetadata}
}
