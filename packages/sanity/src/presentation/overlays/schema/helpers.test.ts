import {
  defineField,
  defineType,
  type ObjectField,
  type ObjectSchemaType,
  type Rule,
} from '@sanity/types'
import {describe, expect, test} from 'vitest'

import {createSchema} from '../../../core/schema/createSchema'
import {
  gatherFields,
  isArrayType,
  isCrossDatasetReferenceType,
  isFieldRequired,
  isNumberType,
  isObjectType,
  isReferenceType,
  isStringType,
  lastType,
  sortByDependencies,
} from './helpers'

function fieldWithValidation(validation: ObjectField['type']['validation']): ObjectField {
  return {
    name: 'title',
    type: {
      name: 'string',
      jsonType: 'string',
      validation,
    },
  } as ObjectField
}

function compiledField(typeName: string, fieldName: string): ObjectField {
  const schema = createSchema({
    name: 'default',
    types: [
      defineType({
        name: typeName,
        type: 'document',
        fields: [
          defineField({
            name: 'requiredTitle',
            type: 'string',
            validation: (rule) => rule.required(),
          }),
          defineField({name: 'optionalTitle', type: 'string'}),
          defineField({
            name: 'minOnly',
            type: 'string',
            validation: (rule) => rule.min(2),
          }),
        ],
      }),
    ],
  })

  const compiled = schema.get(typeName)
  if (!compiled || compiled.jsonType !== 'object') {
    throw new Error(`Expected compiled object type ${typeName}`)
  }

  const field = compiled.fields.find((candidate) => candidate.name === fieldName)
  if (!field) {
    throw new Error(`Expected field ${fieldName} on ${typeName}`)
  }

  return field
}

describe('isFieldRequired', () => {
  test('returns false when the field has no validation', () => {
    expect(isFieldRequired(fieldWithValidation(undefined))).toBe(false)
  })

  test('returns false for an empty validation list', () => {
    expect(isFieldRequired(fieldWithValidation([]))).toBe(false)
  })

  test('returns true when a rule function calls required', () => {
    expect(isFieldRequired(fieldWithValidation([(rule: Rule) => rule.required()]))).toBe(true)
  })

  test('returns true when required is chained after another rule method', () => {
    expect(isFieldRequired(fieldWithValidation([(rule: Rule) => rule.min(1).required()]))).toBe(
      true,
    )
  })

  test('returns false when a rule function never calls required', () => {
    expect(isFieldRequired(fieldWithValidation([(rule: Rule) => rule.min(1)]))).toBe(false)
  })

  test('accepts a single rule function, not only an array', () => {
    expect(isFieldRequired(fieldWithValidation((rule: Rule) => rule.required()))).toBe(true)
  })

  test('returns true if any rule in a mixed list is required', () => {
    expect(
      isFieldRequired(
        fieldWithValidation([(rule: Rule) => rule.min(1), (rule: Rule) => rule.required()]),
      ),
    ).toBe(true)
  })

  test('reads required from a field compiled through createSchema', () => {
    expect(isFieldRequired(compiledField('article', 'requiredTitle'))).toBe(true)
  })

  test('reads optional from a field compiled through createSchema', () => {
    expect(isFieldRequired(compiledField('article', 'optionalTitle'))).toBe(false)
    expect(isFieldRequired(compiledField('article', 'minOnly'))).toBe(false)
  })
})

describe('schema type guards and walks', () => {
  const schema = createSchema({
    name: 'default',
    types: [
      defineType({
        name: 'address',
        type: 'object',
        fields: [defineField({name: 'city', type: 'string'})],
      }),
      defineType({
        name: 'author',
        type: 'document',
        fields: [
          defineField({name: 'name', type: 'string'}),
          defineField({name: 'age', type: 'number'}),
          defineField({name: 'home', type: 'address'}),
          defineField({name: 'tags', type: 'array', of: [{type: 'string'}]}),
          defineField({name: 'peer', type: 'reference', to: [{type: 'author'}]}),
          defineField({
            name: 'datasetPeer',
            type: 'crossDatasetReference',
            dataset: 'other',
            to: [{type: 'author', preview: {select: {title: 'name'}}}],
          }),
        ],
      }),
    ],
  })

  const author = schema.get('author')
  const address = schema.get('address')
  if (!author || author.jsonType !== 'object' || !address) {
    throw new Error('Expected compiled author and address types')
  }

  const authorObject: ObjectSchemaType = author
  const fieldByName = Object.fromEntries(authorObject.fields.map((field) => [field.name, field]))

  test('isObjectType is true for documents and object types', () => {
    expect(isObjectType(author)).toBe(true)
    expect(isObjectType(address)).toBe(true)
    expect(isObjectType(fieldByName.name.type)).toBe(false)
  })

  test('isStringType, isNumberType, isArrayType and isReferenceType walk the type chain', () => {
    expect(isStringType(fieldByName.name.type)).toBe(true)
    expect(isNumberType(fieldByName.age.type)).toBe(true)
    expect(isArrayType(fieldByName.tags.type)).toBe(true)
    expect(isReferenceType(fieldByName.peer.type)).toBe(true)
    expect(isCrossDatasetReferenceType(fieldByName.datasetPeer.type)).toBe(true)
    expect(isReferenceType(fieldByName.name.type)).toBe(false)
  })

  test('lastType returns the deepest builtin type', () => {
    expect(lastType(author)?.name).toBe('document')
    expect(lastType(address)?.name).toBe('object')
    expect(lastType(fieldByName.name.type)?.name).toBe('string')
    expect(lastType(fieldByName.peer.type)?.name).toBe('reference')
  })

  test('gatherFields concatenates inherited object fields then own fields', () => {
    const parent = {
      name: 'address',
      jsonType: 'object' as const,
      fields: [{name: 'city', type: fieldByName.name.type}],
    }
    const child = {
      name: 'employee',
      jsonType: 'object' as const,
      type: parent,
      fields: [{name: 'role', type: fieldByName.name.type}],
    }

    expect(gatherFields(address).map((field) => field.name)).toEqual(['city'])
    expect(gatherFields(child).map((field) => field.name)).toEqual(['city', 'role'])
    expect(gatherFields(author).map((field) => field.name)).toEqual(
      expect.arrayContaining(authorObject.fields.map((field) => field.name)),
    )
    expect(gatherFields(fieldByName.name.type)).toEqual([])
  })
})

describe('sortByDependencies', () => {
  test('includes a document that has only primitive fields', () => {
    const schema = createSchema({
      name: 'default',
      types: [
        defineType({
          name: 'note',
          type: 'document',
          fields: [defineField({name: 'body', type: 'string'})],
        }),
      ],
    })

    expect(sortByDependencies(schema)).toContain('note')
  })

  test('puts a document that embeds a named object before that object', () => {
    const schema = createSchema({
      name: 'default',
      types: [
        defineType({
          name: 'address',
          type: 'object',
          fields: [defineField({name: 'city', type: 'string'})],
        }),
        defineType({
          name: 'author',
          type: 'document',
          fields: [
            defineField({name: 'name', type: 'string'}),
            defineField({name: 'home', type: 'address'}),
          ],
        }),
      ],
    })

    const names = sortByDependencies(schema)
    expect(names).toEqual(expect.arrayContaining(['author', 'address']))
    expect(names.indexOf('author')).toBeLessThan(names.indexOf('address'))
  })

  test('walks array-of named object items', () => {
    const schema = createSchema({
      name: 'default',
      types: [
        defineType({
          name: 'blockItem',
          type: 'object',
          fields: [defineField({name: 'text', type: 'string'})],
        }),
        defineType({
          name: 'page',
          type: 'document',
          fields: [
            defineField({
              name: 'items',
              type: 'array',
              of: [{type: 'blockItem'}],
            }),
          ],
        }),
      ],
    })

    const names = sortByDependencies(schema)
    expect(names).toEqual(expect.arrayContaining(['page', 'blockItem']))
  })

  test('does not throw when two object types form a cycle', () => {
    const schema = createSchema({
      name: 'default',
      types: [
        defineType({
          name: 'nodeA',
          type: 'object',
          fields: [defineField({name: 'child', type: 'nodeB'})],
        }),
        defineType({
          name: 'nodeB',
          type: 'object',
          fields: [defineField({name: 'child', type: 'nodeA'})],
        }),
      ],
    })

    expect(() => sortByDependencies(schema)).not.toThrow()
    expect(sortByDependencies(schema)).toEqual(expect.arrayContaining(['nodeA', 'nodeB']))
  })

  test('treats a document-typed field as a document dependency without throwing', () => {
    const schema = createSchema({
      name: 'default',
      types: [
        defineType({
          name: 'author',
          type: 'document',
          fields: [defineField({name: 'name', type: 'string'})],
        }),
        defineType({
          name: 'book',
          type: 'document',
          fields: [
            defineField({name: 'title', type: 'string'}),
            defineField({name: 'writtenBy', type: 'author'}),
          ],
        }),
      ],
    })

    const names = sortByDependencies(schema)
    expect(names).toEqual(expect.arrayContaining(['author', 'book', 'document']))
  })
})
