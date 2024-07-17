import {beforeEach, describe, expect, jest, test} from '@jest/globals'
import {type ObjectSchemaType, type ReferenceSchemaType, type StringSchemaType} from '@sanity/types'

import {resolveSchemaTypeForPath} from '../resolveSchemaTypeForPath'
import {schema} from './schema'

beforeEach(() => {
  jest.resetModules()
  jest.clearAllMocks()
})

describe('resolveSchemaTypeForPath', () => {
  test('can get schema type from path', () => {
    const authorSchema = schema.get('author')!
    const path = ['bestFriend']
    const schemaType = resolveSchemaTypeForPath(authorSchema, path) as ReferenceSchemaType
    expect(schema._validation).toHaveLength(0)
    expect(schemaType?.name).toEqual('reference')
    expect(schemaType?.jsonType).toEqual('object')
    expect(schemaType?.to[0].name).toEqual('author')
  })

  test('can get schema type from key segment in array', () => {
    const authorSchema = schema.get('editor')!
    const sourceValue = {
      _type: 'editor',
      _id: 'xxx',
      arrayOfPredefinedOptions: [
        {
          _type: 'color',
          title: 'Red',
          name: 'red',
          _key: 'auto-generated-0',
        },
        {
          _type: 'color',
          title: 'Blue',
          name: 'blue',
          _key: 'blue',
        },
      ],
    }
    const path = ['arrayOfPredefinedOptions', {_key: 'blue'}]
    const schemaType = resolveSchemaTypeForPath(
      authorSchema,
      path,
      sourceValue,
    ) as ReferenceSchemaType
    expect(schema._validation).toHaveLength(0)
    expect(schemaType?.name).toEqual('color')
    expect(schemaType?.jsonType).toEqual('object')
  })
  test('can get schema type from nested path in array', () => {
    const authorSchema = schema.get('editor')!
    const sourceValue = {
      _type: 'editor',
      _id: 'xxx',
      arrayOfPredefinedOptions: [
        {
          _type: 'color',
          title: 'Red',
          name: 'red',
          _key: 'auto-generated-0',
        },
        {
          _type: 'color',
          title: 'Blue',
          name: 'blue',
          _key: 'blue',
        },
      ],
    }
    const path = ['arrayOfPredefinedOptions', {_key: 'blue'}, 'title']
    const schemaType = resolveSchemaTypeForPath(
      authorSchema,
      path,
      sourceValue,
    ) as ReferenceSchemaType
    expect(schema._validation).toHaveLength(0)
    expect(schemaType?.name).toEqual('string')
    expect(schemaType?.jsonType).toEqual('string')
  })
  test('can get schema type from nested path in array with multiple types', () => {
    const authorSchema = schema.get('editor')!
    const sourceValue = {
      _type: 'editor',
      _id: 'xxx',
      arrayOfMultipleTypes: [
        {
          _key: 'color-1',
          _type: 'color',
          title: 'Test one',
          name: 'Test name',
        },
      ],
    }
    const path = ['arrayOfMultipleTypes', {_key: 'color-1'}, 'title']
    const schemaType = resolveSchemaTypeForPath(
      authorSchema,
      path,
      sourceValue,
    ) as ReferenceSchemaType
    expect(schema._validation).toHaveLength(0)
    expect(schemaType?.name).toEqual('string')
    expect(schemaType?.jsonType).toEqual('string')
  })
  test('can get schema type from nested array path in array with multiple types', () => {
    const authorSchema = schema.get('editor')!
    const sourceValue = {
      _type: 'editor',
      _id: 'xxx',
      arrayOfMultipleNestedTypes: [
        {
          _key: 'color-1',
          _type: 'color',
          title: 'Test one',
          name: 'Test name',
          nestedArray: [
            {
              _type: 'color',
              _key: 'nested-color-1',
              title: 'Nested title',
            },
          ],
        },
        {
          _key: 'color-2',
          _type: 'color',
          title: 'Test two',
          name: 'Test name',
        },
      ],
    }
    const pathObject = [
      'arrayOfMultipleNestedTypes',
      {_key: 'color-1'},
      'nestedArray',
      {_key: 'nested-color-1'},
    ]
    const pathTitle = [
      'arrayOfMultipleNestedTypes',
      {_key: 'color-1'},
      'nestedArray',
      {_key: 'nested-color-1'},
      'title',
    ]
    const schemaTypeObject = resolveSchemaTypeForPath(
      authorSchema,
      pathObject,
      sourceValue,
    ) as ObjectSchemaType
    const schemaTypeTitle = resolveSchemaTypeForPath(
      authorSchema,
      pathTitle,
      sourceValue,
    ) as StringSchemaType
    expect(schema._validation).toHaveLength(0)
    expect(schemaTypeTitle?.name).toEqual('string')
    expect(schemaTypeTitle?.jsonType).toEqual('string')
    expect(schemaTypeObject?.name).toEqual('color')
    expect(schemaTypeObject?.jsonType).toEqual('object')
  })
  test.failing(
    'fail to get schema type from nested path in array with multiple types without providing value',
    () => {
      const authorSchema = schema.get('editor')!
      const path = ['arrayOfMultipleTypes', {_key: 'color-1'}, 'title']
      const schemaType = resolveSchemaTypeForPath(authorSchema, path) as ReferenceSchemaType
      expect(schema._validation).toHaveLength(0)
      expect(schemaType).toEqual('string')
    },
  )
})
