/* eslint max-nested-callbacks: */

import {defineField, defineType, type ObjectSchemaType} from '@sanity/types'
import {groupProblems, validateSchema} from '@sanity/schema/_internal'
import {createSchema} from '../../../schema'
import {getFieldLevel} from './helpers'

describe('inputResolver/helpers', () => {
  const {onlyIndentationObject, noIndentationObject} = setupTest()

  describe('getFieldLevel', () => {
    const GREATER_THAN_ZERO = 5

    describe('types without indentation', () => {
      noIndentationObject.fields.forEach((field) => {
        it(`${field.type.description} (${field.name})`, () => {
          const baseLevel = getFieldLevel(field.type, GREATER_THAN_ZERO)
          expect(baseLevel).toEqual(0)
        })
      })
    })

    describe('types with indentation', () => {
      onlyIndentationObject.fields.forEach((field) => {
        it(`${field.type.description} (${field.name})`, () => {
          const baseLevel = getFieldLevel(field.type, GREATER_THAN_ZERO)
          expect(baseLevel).toEqual(GREATER_THAN_ZERO)
        })
      })
    })
  })
})

function setupTest() {
  const noIndentationFields = [
    defineField({
      type: 'array',
      name: 'array',
      description: 'plain array',
      of: [{type: 'noIndentationFields'}],
    }),
    defineField({
      type: 'array',
      name: 'arrayTagList',
      description: 'array with tag-list',
      of: [{type: 'string'}],
      options: {
        list: ['1'],
        layout: 'tags',
      },
    }),
    defineField({type: 'file', name: 'file', description: 'file without additional fields'}),
    defineField({type: 'image', name: 'image', description: 'image without additional fields'}),
    defineField({
      type: 'reference',
      name: 'reference',
      description: 'image without additional fields',
      to: [{type: 'noIndentationFields'}],
    }),
    defineField({type: 'slug', name: 'slug', description: 'any slug'}),
  ] as const

  const onlyIndentationFields = [
    defineField({type: 'string', name: 'string', description: 'string without list'}),
    defineField({
      type: 'string',
      name: 'stringEmptyList',
      description: 'string with empty list',
      options: {list: []},
    }),
    defineField({
      type: 'string',
      name: 'stringList',
      description: 'string with list',
      options: {list: ['1']},
    }),

    defineField({type: 'number', name: 'number', description: 'number without list'}),
    defineField({
      type: 'number',
      name: 'numberEmptyList',
      description: 'number with empty list',
      options: {list: []},
    }),
    defineField({
      type: 'number',
      name: 'numberList',
      description: 'number with list',
      options: {list: [1]},
    }),

    defineField({
      type: 'object',
      name: 'objectVisibleFields',
      description: 'object with visible fields',
      fields: [defineField({type: 'string', name: 'string'})],
    }),

    defineField({
      type: 'file',
      name: 'fileVisibleFields',
      description: 'file with visible fields',
      fields: [defineField({type: 'string', name: 'string'})],
    }),
    defineField({
      type: 'image',
      name: 'imageVisibleFields',
      description: 'image with visible fields',
      fields: [defineField({type: 'string', name: 'string'})],
    }),
    defineField({
      type: 'array',
      name: 'arrayList',
      description: 'array with list (and not tag layout)',
      of: [{type: 'string'}],
      options: {
        list: ['1'],
      },
    }),
  ] as const

  const aliasTypes = [...noIndentationFields, ...onlyIndentationFields].map((field) =>
    defineType({...field, name: `${field.name}-alias`}),
  )

  function aliasTypeClone<T extends {name: string; type: string}>(field: T) {
    const clone: any = {...field}
    delete clone.of
    delete clone.to
    delete clone.fields
    return {
      ...clone,
      name: `${field.name}Alias`,
      type: `${field.name}-alias`,
    }
  }

  const schemaDef = {
    name: 'test',
    types: [
      ...aliasTypes,
      defineType({
        name: 'noIndentationFields',
        type: 'object',
        fields: [...noIndentationFields, ...noIndentationFields.map(aliasTypeClone)],
      }),
      defineType({
        name: 'onlyIndentationFields',
        type: 'object',
        fields: [...onlyIndentationFields, ...onlyIndentationFields.map(aliasTypeClone)],
      }),
    ],
  }

  const validated = validateSchema(schemaDef.types).getTypes()
  const validation = groupProblems(validated)
  const errors = validation
    .map((group) => group.problems.filter(({severity}) => severity === 'error'))
    .filter((problems) => problems.length)

  if (errors.length) {
    throw new Error(`Test has incorrectly configured test data: ${JSON.stringify(errors, null, 2)}`)
  }

  const testSchema = createSchema(schemaDef)

  const noIndentationObject: ObjectSchemaType = testSchema.get(
    'noIndentationFields',
  ) as ObjectSchemaType

  const onlyIndentationObject: ObjectSchemaType = testSchema.get(
    'onlyIndentationFields',
  ) as ObjectSchemaType

  return {
    noIndentationObject,
    onlyIndentationObject,
  }
}

export {}
