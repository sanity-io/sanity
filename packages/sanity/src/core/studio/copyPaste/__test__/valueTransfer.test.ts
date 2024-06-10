import {beforeEach, describe, expect, jest, test} from '@jest/globals'
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
      expect(transferValueResult?.targetValue).toEqual({
        ...omit(sourceValue, ['_id']),
        _type: 'editor',
      })
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
      expect(transferValueResult?.targetValue).toEqual({_type: 'nestedObject', title: 'item'})
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
  })
  // test.only('can copy nested objects', () => {
  //   const sourceValue = {
  //     _type: 'nestedObject',
  //     title: 'root',
  //     objectList: [{_type: 'nestedObject', _key: 'yyy', title: 'item', items: []}],
  //   }
  //   const transferValueResult = transferValue({
  //     sourceRootSchemaType: schema.get('author')!,
  //     sourcePath: ['nestedTest', 'objectList', {_key: 'yyy'}],
  //     sourceValue,
  //     targetRootSchemaType: schema.get('editor')!,
  //     targetPath: ['nestedTest'],
  //   })
  //   expect(transferValueResult.errors.length).toEqual(0)
  //   expect(transferValueResult?.targetValue).toEqual({
  //     _type: 'nestedObject',
  //     _key: 'yyy',
  //     title: 'item',
  //     items: [],
  //   })
  // })
})
