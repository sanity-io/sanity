import {randomKey} from '@sanity/util/content'

import {type EditableSystemVariant} from '../types'
import {createVariantId} from './createVariantId'
import {VARIANT_SET_METADATA_KEY, type VariantSetReference} from './variantSet'
import {generateVariantSetPermutations, type VariantSetDimension} from './variantSetPermutations'

/**
 * A generated variant set: the shared reference stamped onto every definition, plus the
 * definitions themselves.
 *
 * @internal
 */
export interface BuiltVariantSet {
  setReference: VariantSetReference
  definitions: EditableSystemVariant[]
}

function buildTitle(setName: string, conditions: Record<string, string>): string {
  const combination = Object.values(conditions).join(' / ')
  return combination ? `${setName}: ${combination}` : setName
}

/**
 * Turn a named set of dimensions into one ready-to-create variant definition per permutation.
 * Each definition gets a fresh id, an auto-generated title, and a back-reference to the set so
 * the generated batch can be grouped and traced later. Pure aside from id generation.
 *
 * @internal
 */
export function buildVariantSetDefinitions(input: {
  name: string
  dimensions: VariantSetDimension[]
}): BuiltVariantSet {
  const setReference: VariantSetReference = {id: randomKey(12), name: input.name.trim()}
  const permutations = generateVariantSetPermutations(input.dimensions)

  const definitions = permutations.map(
    (conditions): EditableSystemVariant => ({
      _id: createVariantId(),
      _type: 'system.variant',
      conditions,
      priority: 0,
      metadata: {
        title: buildTitle(setReference.name, conditions),
        description: [],
        [VARIANT_SET_METADATA_KEY]: setReference,
      },
    }),
  )

  return {setReference, definitions}
}
