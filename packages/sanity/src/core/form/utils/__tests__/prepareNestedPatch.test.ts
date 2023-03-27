import {Schema as SchemaBuilder} from '@sanity/schema'
import {
  ArraySchemaType,
  isArrayOfObjectsSchemaType,
  isArraySchemaType,
  isDocumentSchemaType,
  isObjectSchemaType,
  ObjectSchemaType,
  Path,
  SchemaType,
} from '@sanity/types'
import {FormPatch, PatchArg, set, setIfMissing} from '../../patch'
import {getItemType, getPrimitiveItemType} from '../../store/utils/getItemType'
import {createProtoValue} from '../createProtoValue'
import {getSetIfMissingPatches} from '../prepareNestedPatch'

const schema = SchemaBuilder.compile({
  types: [
    {
      name: 'debug',
      type: 'document',
      fields: [
        {name: 'someString', type: 'string'},
        {
          name: 'someObject',
          type: 'object',
          fields: [
            {
              type: 'string',
              name: 'someString',
            },
            {
              type: 'object',
              name: 'someNestedObject',
              fields: [{type: 'string', name: 'someNestedString'}],
            },
          ],
        },
        {
          name: 'somePrimitiveArray',
          type: 'array',
          of: [
            {
              type: 'string',
            },
          ],
        },
        {
          name: 'someObjectArray',
          type: 'array',
          of: [
            {
              type: 'object',
              // type is implicitly 'object'
              fields: [
                {
                  name: 'nested',
                  type: 'object',
                  fields: [{type: 'string', name: 'someString'}],
                },
              ],
            },
            {
              type: 'object',
              name: 'place',
              fields: [
                {
                  name: 'city',
                  type: 'string',
                },
                {
                  name: 'country',
                  type: 'string',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
})

test('getSetIfMissingPatches for primitive values', () => {
  const docType = schema.get('debug') as ObjectSchemaType
  const p = getSetIfMissingPatches(
    docType,
    ['someString'],
    {} // value is ignored for objects
  )
  expect(p).toMatchObject([])
})

test('getSetIfMissingPatches for nested objects', () => {
  const docType = schema.get('debug') as ObjectSchemaType
  const p = getSetIfMissingPatches(
    docType,
    ['someObject', 'someNestedObject', 'someNestedString'],
    {} // value is ignored for objects
  )
  expect(p).toMatchObject([
    {
      path: ['someObject'],
      type: 'setIfMissing',
      value: {},
    },

    {
      path: ['someObject', 'someNestedObject'],
      type: 'setIfMissing',
      value: {},
    },
  ])
})

test('getSetIfMissingPatches for nested arrays', () => {
  const docType = schema.get('debug') as ObjectSchemaType
  const p = getSetIfMissingPatches(
    docType,
    ['someObject', 'someNestedObject', 'someNestedString'],
    {} // value is ignored for objects
  )
  expect(p).toMatchObject([
    {
      path: ['someObject'],
      type: 'setIfMissing',
      value: {},
    },

    {
      path: ['someObject', 'someNestedObject'],
      type: 'setIfMissing',
      value: {},
    },
  ])
})

test('getSetIfMissingPatches for primitive arrays', () => {
  const docType = schema.get('debug') as ObjectSchemaType
  const p = getSetIfMissingPatches(
    docType,
    ['somePrimitiveArray', -1],
    {} // value is ignored for objects
  )
  expect(p).toMatchObject([
    {
      path: ['somePrimitiveArray'],
      type: 'setIfMissing',
      value: [],
    },
  ])
})

test('getSetIfMissingPatches for anonymous objects inside arrays', () => {
  const docType = schema.get('debug') as ObjectSchemaType
  const p = getSetIfMissingPatches(
    docType,
    ['someObjectArray', {_key: 'bar'}, 'nested', 'someString'],
    {
      someObjectArray: [{_key: 'foo'}, {_key: 'bar'}],
    }
  )
  expect(p).toMatchObject([
    {
      path: ['someObjectArray'],
      type: 'setIfMissing',
      value: [],
    },
    {
      path: ['someObjectArray', {_key: 'bar'}],
      type: 'setIfMissing',
      value: {},
    },
    {
      path: ['someObjectArray', {_key: 'bar'}, 'nested'],
      type: 'setIfMissing',
      value: {},
    },
  ])
})

test('getSetIfMissingPatches for named objects inside arrays', () => {
  const docType = schema.get('debug') as ObjectSchemaType
  const p = getSetIfMissingPatches(docType, ['someObjectArray', {_key: 'bar'}, 'city'], {
    someObjectArray: [{_key: 'foo'}, {_key: 'bar', _type: 'place'}],
  })
  expect(p).toMatchObject([
    {
      path: ['someObjectArray'],
      type: 'setIfMissing',
      value: [],
    },
    {
      path: ['someObjectArray', {_key: 'bar'}],
      type: 'setIfMissing',
      value: {
        _type: 'place',
      },
    },
  ])
})
