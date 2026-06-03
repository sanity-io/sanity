import {describe, expect, it} from 'vitest'

import {
  defineArrayMember,
  defineField,
  defineType,
  hasObjectJsonType,
  isObjectSchemaType,
  isUnionSchemaType,
  type BooleanDefinition,
  type ObjectSchemaType,
  type ObjectBackedUnionIntrinsicTypeName,
  type UnionDefinition,
  type UnionSchemaType,
} from '../src/schema'

describe('union types', () => {
  it('allows named union schema declarations', () => {
    const unionDef = defineType({
      name: 'promotion',
      type: 'union',
      of: [{type: 'object', fields: []}, {type: 'productPromotion'}, {type: 'articlePromotion'}],
      validation: (Rule) => [
        Rule.required(),
        Rule.optional(),
        Rule.skip(),
        Rule.custom((value) => (value?._type ? true : 'Expected selected promotion')),
        // @ts-expect-error min does not exist on UnionRule
        Rule.min(1),
        // @ts-expect-error fields does not exist on UnionRule
        Rule.fields({title: (fieldRule) => fieldRule.required()}),
      ],
    })

    let assignableToUnion: UnionDefinition = unionDef
    assignableToUnion = defineType(assignableToUnion)
    expect(assignableToUnion).toBe(unionDef)

    // @ts-expect-error union is not assignable to boolean
    const notAssignableToBoolean: BooleanDefinition = unionDef
    expect(notAssignableToBoolean).toBe(unionDef)

    let objectBackedType: ObjectBackedUnionIntrinsicTypeName = 'object'
    objectBackedType = 'reference'
    objectBackedType = 'block'
    // @ts-expect-error primitive types are not object-backed union intrinsics
    objectBackedType = 'string'
    expect(objectBackedType).toBe('string')
  })

  it('allows fields to reference a named type called union without inline union support', () => {
    defineField({
      name: 'legacyValue',
      type: 'union',
    })

    defineField({
      name: 'notInlineUnion',
      type: 'union',
      // @ts-expect-error inline union fields are out of scope for the first version
      of: [{type: 'productPromotion'}],
    })

    defineArrayMember({
      type: 'union',
    })

    defineType({
      name: 'reusedPromotions',
      type: 'array',
      of: [{type: 'promotion'}],
    })

    defineArrayMember({
      type: 'union',
      // @ts-expect-error inline union array members are out of scope for the first version
      of: [{type: 'productPromotion'}],
    })

    defineType({
      name: 'container',
      type: 'object',
      fields: [
        {
          name: 'inlineUnion',
          type: 'union',
          // @ts-expect-error inline union fields are out of scope for the first version
          of: [{type: 'productPromotion'}],
        },
      ],
    })

    defineType({
      name: 'body',
      type: 'array',
      of: [
        {
          type: 'union',
          // @ts-expect-error inline union array members are out of scope for the first version
          of: [{type: 'productPromotion'}],
        },
      ],
    })
  })

  it('distinguishes object-backed storage from object schema fields', () => {
    const compiledUnion = {
      name: 'promotion',
      jsonType: 'object',
      unionKind: 'object',
      __experimental_union: true,
      of: [],
    } as unknown as UnionSchemaType

    const compiledObject = {
      name: 'productPromotion',
      jsonType: 'object',
      fields: [],
    } as unknown as ObjectSchemaType

    expect(isUnionSchemaType(compiledUnion)).toBe(true)
    expect(isUnionSchemaType({...compiledUnion, of: undefined})).toBe(false)
    expect(isUnionSchemaType({...compiledUnion, unionKind: 'primitive'})).toBe(false)
    expect(hasObjectJsonType(compiledUnion)).toBe(true)
    expect(isObjectSchemaType(compiledUnion)).toBe(false)
    expect(isUnionSchemaType(compiledObject)).toBe(false)
    expect(hasObjectJsonType(compiledObject)).toBe(true)
    expect(isObjectSchemaType(compiledObject)).toBe(true)
  })
})
