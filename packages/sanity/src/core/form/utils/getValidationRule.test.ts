import {
  defineField,
  defineType,
  type NumberRule,
  type ObjectSchemaType,
  type SchemaType,
  type ValidationContext,
} from '@sanity/types'
import {describe, expect, test} from 'vitest'

import {createSchema} from '../../schema/createSchema'
import {getValidationRule} from './getValidationRule'

// `defineField` types `validation` as a single builder function, while the runtime also accepts an
// array of them, so this type is declared without `defineType`
const arrayValidationDoc = {
  name: 'arrayValidation',
  type: 'document',
  fields: [
    {
      name: 'mixedArity',
      type: 'number',
      validation: [
        (rule: NumberRule) => rule.integer(),
        (rule: NumberRule, context?: ValidationContext) =>
          context?.hidden ? rule.skip() : rule.min(2),
      ],
    },
  ],
}

const schema = createSchema({
  name: 'test',
  types: [
    defineType({
      name: 'validationArity',
      type: 'document',
      fields: [
        defineField({
          name: 'urlArity1',
          type: 'url',
          validation: (rule) => rule.uri({allowRelative: true}),
        }),
        defineField({
          name: 'urlArity2',
          type: 'url',
          validation: (rule, context) =>
            context?.hidden ? rule.skip() : rule.uri({allowRelative: true}),
        }),
        defineField({
          name: 'numberArity2',
          type: 'number',
          validation: (rule, context) =>
            context?.hidden ? rule.skip() : rule.required().min(1).integer(),
        }),
        defineField({
          name: 'arrayArity2',
          type: 'array',
          of: [{type: 'string'}],
          validation: (rule, context) => (context?.hidden ? rule.skip() : rule.max(3)),
        }),
        defineField({
          name: 'urlUnsafeContextAccess',
          type: 'url',
          // Simulates validation that assumes a context is always present, which only holds while
          // validating a document
          validation: (rule, context) => rule.uri({scheme: [context!.document!._type]}),
        }),
      ],
    }),
    arrayValidationDoc,
  ],
})

function getFieldType(typeName: string, fieldName: string): SchemaType {
  const document = schema.get(typeName) as ObjectSchemaType
  const field = document.fields.find((candidate) => candidate.name === fieldName)
  if (!field) throw new Error(`No such field: ${typeName}.${fieldName}`)
  return field.type
}

describe('getValidationRule', () => {
  test('reads rules from single-argument validation', () => {
    expect(
      getValidationRule(getFieldType('validationArity', 'urlArity1'), 'uri')?.constraint?.options,
    ).toMatchObject({allowRelative: true})
  })

  test('reads rules from two-argument (context-aware) validation', () => {
    expect(
      getValidationRule(getFieldType('validationArity', 'urlArity2'), 'uri')?.constraint?.options,
    ).toMatchObject({allowRelative: true})
    expect(
      getValidationRule(getFieldType('validationArity', 'numberArity2'), 'min')?.constraint,
    ).toBe(1)
    expect(
      getValidationRule(getFieldType('validationArity', 'numberArity2'), 'integer'),
    ).not.toBeNull()
    expect(
      getValidationRule(getFieldType('validationArity', 'arrayArity2'), 'max')?.constraint,
    ).toBe(3)
  })

  test('reads rules from an array mixing plain and context-aware validation', () => {
    expect(
      getValidationRule(getFieldType('arrayValidation', 'mixedArity'), 'integer'),
    ).not.toBeNull()
    expect(
      getValidationRule(getFieldType('arrayValidation', 'mixedArity'), 'min')?.constraint,
    ).toBe(2)
  })

  test('returns null when validation cannot be resolved without a context', () => {
    expect(
      getValidationRule(getFieldType('validationArity', 'urlUnsafeContextAccess'), 'uri'),
    ).toBeNull()
  })
})
