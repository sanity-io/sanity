import {beforeEach, describe, expect, jest, test} from '@jest/globals'
import {type TypedObject} from '@sanity/types'
import {omit} from 'lodash'

import {resolveSchemaTypeForPath} from '../resolveSchemaTypeForPath'
import {transferValue} from '../valueTransfer'
import {schema} from './schema'

beforeEach(() => {
  jest.resetModules()
  jest.clearAllMocks()
})

describe('transferValue', () => {
  test('cannot copy from one type to another if the schema json type is different', () => {
    const sourceValue = {
      _type: 'author',
      _id: 'xxx',
      bio: [
        {
          _key: 'someKey',
          _type: 'customNamedBlock',
          children: [{_key: 'someOtherKey', _type: 'span', text: 'Hello'}],
        },
      ],
    }
    const transferValueResult = transferValue({
      sourceRootSchemaType: schema.get('author')!,
      sourcePath: [],
      sourceValue,
      targetRootSchemaType: schema.get('editor')!,
      targetPath: ['bio'],
    })
    expect(transferValueResult.errors.length).toEqual(1)
    expect(transferValueResult.errors[0].message).toEqual(
      'Source and target schema types are not compatible',
    )
  })

  describe('objects', () => {
    test('can copy object', () => {
      const sourceValue = {
        _type: 'author',
        _id: 'xxx',
        bio: [
          {
            _key: 'someKey',
            _type: 'customNamedBlock',
            children: [{_key: 'someOtherKey', _type: 'span', text: 'Hello'}],
          },
        ],
      }
      const transferValueResult = transferValue({
        sourceRootSchemaType: schema.get('author')!,
        sourcePath: [],
        sourceValue,
        targetRootSchemaType: schema.get('editor')!,
        targetPath: [],
      })
      const targetValue = transferValueResult?.targetValue as {
        bio: (TypedObject & {children: TypedObject[]})[]
      }
      expect(targetValue).toMatchObject({
        ...omit(sourceValue, ['_id']),
        bio: [
          {
            _key: expect.any(String),
            _type: 'customNamedBlock',
            children: [{_key: expect.any(String), _type: 'span', text: 'Hello'}],
          },
        ],
        _type: 'editor',
      })
      // Test that the keys are not the same
      expect(targetValue.bio[0]._key).not.toEqual('someKey')
      expect(targetValue.bio[0].children[0]._key).not.toEqual('someOtherKey')
    })

    test('can copy array of numbers', () => {
      const sourceValue = {
        _type: 'author',
        _id: 'xxx',
        favoriteNumbers: [1, 2, 3, 4, 'foo'],
      }
      const transferValueResult = transferValue({
        sourceRootSchemaType: schema.get('author')!,
        sourcePath: ['favoriteNumbers'],
        sourceValue,
        targetRootSchemaType: schema.get('editor')!,
        targetPath: ['favoriteNumbers'],
      })
      expect(transferValueResult?.targetValue).toEqual([1, 2, 3, 4])
    })

    test('can copy nested objects', () => {
      const sourceValue = {_type: 'nestedObject', _key: 'yyy', title: 'item', items: []}
      const schemaTypeAtPath = resolveSchemaTypeForPath(schema.get('author')!, ['nestedTest'])
      const transferValueResult = transferValue({
        sourceRootSchemaType: schemaTypeAtPath!,
        sourcePath: [],
        sourceValue,
        targetRootSchemaType: schema.get('editor')!,
        targetPath: ['nestedTest'],
      })
      expect(transferValueResult?.targetValue).toMatchObject({
        _type: 'nestedObject',
        title: 'item',
        _key: expect.any(String),
      })
    })

    test('can copy image objects', () => {
      const sourceValue = {
        _type: 'image',
        asset: {
          _ref: 'image-e4be7fa20bb20c271060a46bca82b9e84907a13a-320x320-jpg',
          _type: 'reference',
        },
      }
      const schemaTypeAtPath = resolveSchemaTypeForPath(schema.get('author')!, ['profileImage'])
      const transferValueResult = transferValue({
        sourceRootSchemaType: schemaTypeAtPath!,
        sourcePath: [],
        sourceValue,
        targetRootSchemaType: schema.get('editor')!,
        targetPath: ['profileImage'],
      })
      expect(transferValueResult?.targetValue).toEqual(sourceValue)
    })

    test('cannot copy image into file objects', () => {
      const sourceValue = {
        _type: 'image',
        asset: {
          _ref: 'image-e4be7fa20bb20c271060a46bca82b9e84907a13a-320x320-jpg',
          _type: 'reference',
        },
      }
      const schemaTypeAtPath = resolveSchemaTypeForPath(schema.get('author')!, ['profileImage'])
      const transferValueResult = transferValue({
        sourceRootSchemaType: schemaTypeAtPath!,
        sourcePath: [],
        sourceValue,
        targetRootSchemaType: schema.get('editor')!,
        targetPath: ['profileCV'],
      })
      expect(transferValueResult.errors.length).toEqual(1)
      expect(transferValueResult.errors[0].message).toEqual('A image is not allowed in a file')
    })

    test('can copy weak references into hard references', () => {
      const sourceValue = {
        _type: 'reference',
        _ref: 'e4be7fa20bb20c271060a46bca82b9e84907a13a-320x320-jpg',
        _weak: true,
      }
      const schemaTypeAtPath = resolveSchemaTypeForPath(schema.get('author')!, ['bestFriend'])
      const transferValueResult = transferValue({
        sourceRootSchemaType: schemaTypeAtPath!,
        sourcePath: [],
        sourceValue,
        targetRootSchemaType: schema.get('editor')!,
        targetPath: ['bestAuthorFriend'],
      })
      expect(transferValueResult?.targetValue).toEqual(omit(sourceValue, ['_weak']))
    })

    test('can copy hard references into weak references', () => {
      const sourceValue = {
        _type: 'reference',
        _ref: 'e4be7fa20bb20c271060a46bca82b9e84907a13a-320x320-jpg',
      }
      const schemaTypeAtPath = resolveSchemaTypeForPath(schema.get('editor')!, ['bestAuthorFriend'])
      const transferValueResult = transferValue({
        sourceRootSchemaType: schemaTypeAtPath!,
        sourcePath: [],
        sourceValue,
        targetRootSchemaType: schema.get('author')!,
        targetPath: ['bestFriend'],
      })
      expect(transferValueResult?.targetValue).toEqual({...sourceValue, _weak: true})
    })

    test('will remove empty reference', () => {
      const sourceValue = {
        _type: 'author',
        _id: 'xxx',
        bio: [
          {
            _key: 'someKey',
            _type: 'customNamedBlock',
            children: [{_key: 'someOtherKey', _type: 'span', text: 'Hello'}],
          },
          {
            _key: 'someKey2',
            _type: 'reference',
          },
        ],
      }
      const transferValueResult = transferValue({
        sourceRootSchemaType: schema.get('author')!,
        sourcePath: [],
        sourceValue,
        targetRootSchemaType: schema.get('author')!,
        targetPath: [],
      })
      const targetValue = transferValueResult?.targetValue as {
        bio: (TypedObject & {children: TypedObject[]})[]
      }
      expect(targetValue).toMatchObject({
        ...omit(sourceValue, ['_id']),
        bio: [
          {
            _key: expect.any(String),
            _type: 'customNamedBlock',
            children: [{_key: expect.any(String), _type: 'span', text: 'Hello'}],
          },
        ],
      })
      // Test that the keys are not the same
      expect(targetValue.bio[0]._key).not.toEqual('someKey')
      expect(targetValue.bio[0].children[0]._key).not.toEqual('someOtherKey')
      expect(targetValue.bio.length).toEqual(1)
    })
  })
})
