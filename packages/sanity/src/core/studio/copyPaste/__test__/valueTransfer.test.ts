import {beforeEach, describe, expect, jest, test} from '@jest/globals'
import {type TypedObject} from '@sanity/types'
import {omit} from 'lodash'

import {resolveSchemaTypeForPath} from '../resolveSchemaTypeForPath'
import {transferValue} from '../valueTransfer'
import {createMockClient} from './mockClient'
import {schema} from './schema'

beforeEach(() => {
  jest.resetModules()
  jest.clearAllMocks()
})

describe('transferValue', () => {
  test('cannot copy from one type to another if the schema json type is different', async () => {
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
    const transferValueResult = await transferValue({
      sourceRootSchemaType: schema.get('author')!,
      sourcePath: [],
      sourceValue,
      targetRootSchemaType: schema.get('editor')!,
      targetPath: ['bio'],
    })
    expect(transferValueResult.errors.length).toEqual(1)
    expect(transferValueResult.errors[0].i18n.key).toEqual(
      'copy-paste.on-paste.validation.schema-type-incompatible.description',
    )
  })

  describe('documents', () => {
    test('can copy document of same type', async () => {
      const sourceValue = {_type: 'author', _id: 'xxx', name: 'Knut'}
      const transferValueResult = await transferValue({
        sourceRootSchemaType: schema.get('author')!,
        sourcePath: [],
        sourceValue,
        targetRootSchemaType: schema.get('author')!,
        targetPath: [],
      })
      expect(transferValueResult?.targetValue).toEqual({_type: 'author', name: 'Knut'})
    })

    test('can copy document of different type with shared fields', async () => {
      const sourceValue = {
        _type: 'author',
        _id: 'xxx',
        name: 'Knut',
        uniqueStringNotInOtherDocument: 'Testing, testing',
        friends: [
          {
            _key: 'someKey-1',
            _type: 'reference',
            _ref: 'e4be7fa20bb20c271060a46bca82b9e84907a13a-320x320-jpg',
          },
        ],
      }
      const transferValueResult = await transferValue({
        sourceRootSchemaType: schema.get('author')!,
        sourcePath: [],
        sourceValue,
        targetRootSchemaType: schema.get('editor')!,
        targetPath: [],
      })
      expect(transferValueResult?.errors.length).toEqual(0)
      expect(transferValueResult?.targetValue).toEqual({
        _type: 'editor',
        name: 'Knut',
        friends: [
          {
            _key: expect.any(String),
            _type: 'reference',
            _ref: 'e4be7fa20bb20c271060a46bca82b9e84907a13a-320x320-jpg',
          },
        ],
      })
    })
  })

  describe('strings', () => {
    test('can copy string', async () => {
      const sourceValue = {_type: 'author', _id: 'xxx', name: 'Knut'}
      const transferValueResult = await transferValue({
        sourceRootSchemaType: schema.get('author')!,
        sourcePath: ['name'],
        sourceValue,
        targetRootSchemaType: schema.get('editor')!,
        targetPath: ['name'],
      })
      expect(transferValueResult?.targetValue).toEqual('Knut')
    })

    test('can copy string into number', async () => {
      const sourceValue = {_type: 'author', _id: 'xxx', name: 'Knut'}
      const transferValueResult = await transferValue({
        sourceRootSchemaType: schema.get('author')!,
        sourcePath: ['name'],
        sourceValue,
        targetRootSchemaType: schema.get('editor')!,
        targetPath: ['born'],
      })
      expect(transferValueResult?.errors.length).toEqual(1)
    })

    test('can copy string into number with list', async () => {
      const sourceValue = {_type: 'author', _id: 'xxx', name: 'Knut'}
      const transferValueResult = await transferValue({
        sourceRootSchemaType: schema.get('author')!,
        sourcePath: ['name'],
        sourceValue,
        targetRootSchemaType: schema.get('editor')!,
        targetPath: ['testNumberWithListObjects'],
      })
      expect(transferValueResult?.errors.length).toEqual(1)
    })

    test('can copy string into array of strings', async () => {
      const sourceValue = {_type: 'author', _id: 'xxx', name: 'Knut'}
      const transferValueResult = await transferValue({
        sourceRootSchemaType: schema.get('author')!,
        sourcePath: ['name'],
        sourceValue,
        targetRootSchemaType: schema.get('editor')!,
        targetPath: ['favoriteStrings'],
      })
      expect(transferValueResult?.errors.length).toEqual(0)
      expect(transferValueResult?.targetValue).toEqual(['Knut'])
    })
  })

  describe('references', () => {
    // generate tests for reference to reference, array of references
    test('can copy reference', async () => {
      const sourceValue = {
        _type: 'author',
        _id: 'xxx',
        bestFriend: {_type: 'reference', _ref: 'yyy'},
      }
      const transferValueResult = await transferValue({
        sourceRootSchemaType: schema.get('author')!,
        sourcePath: ['bestFriend'],
        sourceValue,
        targetRootSchemaType: schema.get('editor')!,
        targetPath: ['bestAuthorFriend'],
      })
      expect(transferValueResult?.targetValue).toEqual({_type: 'reference', _ref: 'yyy'})
    })
    test('cant copy reference into another that doesnt accept type', async () => {
      const sourceValue = {
        _type: 'author',
        _id: 'xxx',
        bestFriend: {_type: 'reference', _ref: 'yyy'},
      }
      const transferValueResult = await transferValue({
        sourceRootSchemaType: schema.get('author')!,
        sourcePath: ['bestFriend'],
        sourceValue,
        targetRootSchemaType: schema.get('editor')!,
        targetPath: ['relatedEditor'],
      })
      expect(transferValueResult?.errors.length).toEqual(1)
      expect(transferValueResult?.targetValue).toEqual(undefined)
    })
  })

  describe('booleans', () => {
    test('can copy boolean', async () => {
      const sourceValue = {_type: 'author', _id: 'xxx', isVerified: true}
      const transferValueResult = await transferValue({
        sourceRootSchemaType: schema.get('author')!,
        sourcePath: ['isVerified'],
        sourceValue,
        targetRootSchemaType: schema.get('editor')!,
        targetPath: ['isVerified'],
      })
      expect(transferValueResult?.targetValue).toEqual(true)
    })
    test('can copy boolean into array of booleans', async () => {
      const sourceValue = {_type: 'editor', _id: 'xxx', isVerified: false}
      const transferValueResult = await transferValue({
        sourceRootSchemaType: schema.get('editor')!,
        sourcePath: ['isVerified'],
        sourceValue,
        targetRootSchemaType: schema.get('editor')!,
        targetPath: ['favoriteBooleans'],
      })
      expect(transferValueResult?.errors.length).toEqual(0)
      expect(transferValueResult?.targetValue).toEqual([false])
    })

    test('can copy booleans inside objects', async () => {
      const sourceValue = {
        _type: 'editor',
        _id: 'xxx',
        profile: {
          _type: 'profile',
          isFavorite: false,
        },
      }
      const transferValueResult = await transferValue({
        sourceRootSchemaType: schema.get('editor')!,
        sourcePath: ['profile'],
        sourceValue,
        targetRootSchemaType: schema.get('editor')!,
        targetPath: ['profile'],
      })
      expect(transferValueResult?.targetValue).toMatchObject({
        _type: 'object',
        isFavorite: false,
      })
    })
  })

  describe('arrays', () => {
    test('can copy array of numbers', async () => {
      const sourceValue = {_type: 'author', _id: 'xxx', favoriteNumbers: [1, 2, 3]}
      const transferValueResult = await transferValue({
        sourceRootSchemaType: schema.get('author')!,
        sourcePath: ['favoriteNumbers'],
        sourceValue,
        targetRootSchemaType: schema.get('editor')!,
        targetPath: ['favoriteNumbers'],
      })
      expect(transferValueResult?.targetValue).toEqual([1, 2, 3])
    })
    test('can copy array of strings', async () => {
      const sourceValue = {
        _type: 'editor',
        _id: 'xxx',
        favoriteStrings: ['Alice', 'Bob', 'Charlie'],
      }
      const transferValueResult = await transferValue({
        sourceRootSchemaType: schema.get('editor')!,
        sourcePath: ['favoriteStrings'],
        sourceValue,
        targetRootSchemaType: schema.get('editor')!,
        targetPath: ['favoriteStrings'],
      })
      expect(transferValueResult?.targetValue).toEqual(['Alice', 'Bob', 'Charlie'])
    })
    test('can copy array of predefined options', async () => {
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
      const transferValueResult = await transferValue({
        sourceRootSchemaType: schema.get('editor')!,
        sourcePath: ['arrayOfPredefinedOptions'],
        sourceValue,
        targetRootSchemaType: schema.get('editor')!,
        targetPath: ['arrayOfPredefinedOptions'],
      })
      expect(transferValueResult?.targetValue).toEqual([
        {_key: expect.any(String), title: 'Red', name: 'red', _type: 'color'},
        {_key: expect.any(String), title: 'Blue', name: 'blue', _type: 'color'},
      ])
    })
    test('can copy array of multiple types', async () => {
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
      const transferValueResult = await transferValue({
        sourceRootSchemaType: schema.get('editor')!,
        sourcePath: ['arrayOfPredefinedOptions'],
        sourceValue,
        targetRootSchemaType: schema.get('editor')!,
        targetPath: ['arrayOfPredefinedOptions'],
      })
      expect(transferValueResult?.targetValue).toEqual([
        {_key: expect.any(String), title: 'Red', name: 'red', _type: 'color'},
        {_key: expect.any(String), title: 'Blue', name: 'blue', _type: 'color'},
      ])
    })
  })

  describe('numbers', () => {
    test('can copy number', async () => {
      const sourceValue = {_type: 'author', _id: 'xxx', born: 1984}
      const transferValueResult = await transferValue({
        sourceRootSchemaType: schema.get('author')!,
        sourcePath: ['born'],
        sourceValue,
        targetRootSchemaType: schema.get('editor')!,
        targetPath: ['born'],
      })
      expect(transferValueResult?.targetValue).toEqual(1984)
    })

    test('can copy number into string', async () => {
      const sourceValue = {_type: 'author', _id: 'xxx', born: 1984}
      const transferValueResult = await transferValue({
        sourceRootSchemaType: schema.get('author')!,
        sourcePath: ['born'],
        sourceValue,
        targetRootSchemaType: schema.get('editor')!,
        targetPath: ['name'],
      })
      expect(transferValueResult?.errors.length).toEqual(0)
      expect(transferValueResult?.targetValue).toEqual('1984')
    })

    test('can copy number into number', async () => {
      const sourceValue = {_type: 'author', _id: 'xxx', born: 1984}
      const transferValueResult = await transferValue({
        sourceRootSchemaType: schema.get('author')!,
        sourcePath: ['born'],
        sourceValue,
        targetRootSchemaType: schema.get('editor')!,
        targetPath: ['born'],
      })
      expect(transferValueResult?.targetValue).toEqual(1984)
    })

    test('can copy number into number with list', async () => {
      const sourceValue = {_type: 'author', _id: 'xxx', born: 1}
      const transferValueResult = await transferValue({
        sourceRootSchemaType: schema.get('author')!,
        sourcePath: ['born'],
        sourceValue,
        targetRootSchemaType: schema.get('editor')!,
        targetPath: ['testNumberWithListObjects'],
      })
      expect(transferValueResult?.targetValue).toEqual(1)
    })

    test('can copy number into array of strings', async () => {
      const sourceValue = {_type: 'author', _id: 'xxx', born: 1}
      const transferValueResult = await transferValue({
        sourceRootSchemaType: schema.get('author')!,
        sourcePath: ['born'],
        sourceValue,
        targetRootSchemaType: schema.get('editor')!,
        targetPath: ['favoriteStrings'],
      })
      expect(transferValueResult?.errors.length).toEqual(0)
      expect(transferValueResult?.targetValue).toEqual(['1'])
    })

    test('can copy number into array of primitive numbers', async () => {
      const sourceValue = {_type: 'author', _id: 'xxx', born: 1}
      const transferValueResult = await transferValue({
        sourceRootSchemaType: schema.get('author')!,
        sourcePath: ['born'],
        sourceValue,
        targetRootSchemaType: schema.get('editor')!,
        targetPath: ['favoriteNumbers'],
      })
      expect(transferValueResult?.targetValue).toEqual([1])
    })

    test('can copy number into number with list and numbers', async () => {
      const sourceValue = {_type: 'author', _id: 'xxx', born: 1}
      const transferValueResult = await transferValue({
        sourceRootSchemaType: schema.get('author')!,
        sourcePath: ['born'],
        sourceValue,
        targetRootSchemaType: schema.get('editor')!,
        targetPath: ['testNumberWithListObjects'],
      })
      expect(transferValueResult?.targetValue).toEqual(1)
    })
  })

  describe('objects', () => {
    test('can copy object', async () => {
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
      const transferValueResult = await transferValue({
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

    test('can copy array of numbers', async () => {
      const sourceValue = {
        _type: 'author',
        _id: 'xxx',
        favoriteNumbers: [1, 2, 3, 4, 'foo'],
      }
      const transferValueResult = await transferValue({
        sourceRootSchemaType: schema.get('author')!,
        sourcePath: ['favoriteNumbers'],
        sourceValue,
        targetRootSchemaType: schema.get('editor')!,
        targetPath: ['favoriteNumbers'],
      })
      expect(transferValueResult?.targetValue).toEqual([1, 2, 3, 4])
    })

    test('can copy nested objects', async () => {
      const sourceValue = {_type: 'nestedObject', _key: 'yyy', title: 'item', items: []}
      const schemaTypeAtPath = resolveSchemaTypeForPath(schema.get('author')!, ['nestedTest'])
      const transferValueResult = await transferValue({
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

    test('can copy image objects', async () => {
      const sourceValue = {
        _type: 'image',
        asset: {
          _ref: 'image-e4be7fa20bb20c271060a46bca82b9e84907a13a-320x320-jpg',
          _type: 'reference',
        },
      }
      const schemaTypeAtPath = resolveSchemaTypeForPath(schema.get('author')!, ['profileImage'])
      const transferValueResult = await transferValue({
        sourceRootSchemaType: schemaTypeAtPath!,
        sourcePath: [],
        sourceValue,
        targetRootSchemaType: schema.get('editor')!,
        targetPath: ['profileImage'],
      })
      expect(transferValueResult?.targetValue).toEqual(sourceValue)
    })

    test('will validate image objects', async () => {
      const mockClient = createMockClient({
        'image-1': {mimeType: 'image/jpeg', originalFilename: 'test.jpg'},
        'file-1': {mimeType: 'application/pdf', originalFilename: 'test.pdf'},
      })

      const sourceValue = {
        _type: 'image',
        asset: {
          _ref: 'image-1',
          _type: 'reference',
        },
      }
      const schemaTypeAtPath = resolveSchemaTypeForPath(schema.get('author')!, ['profileImage'])
      const transferValueResult = await transferValue({
        sourceRootSchemaType: schemaTypeAtPath!,
        sourcePath: [],
        sourceValue,
        targetRootSchemaType: schema.get('editor')!,
        targetPath: ['profileImagePNG'],
        options: {
          client: mockClient,
          validateAssets: true,
        },
      })
      // expect(transferValueResult?.targetValue).toEqual(sourceValue)
      expect(transferValueResult.errors.length).toEqual(1)
      expect(transferValueResult.errors[0].message).toEqual(
        'MIME type image/jpeg is not accepted for this field',
      )
    })

    test('will paste image into field that accepts same mime type', async () => {
      const mockClient = createMockClient({
        'image-1': {mimeType: 'image/jpeg', originalFilename: 'test.jpg'},
        'file-1': {mimeType: 'application/pdf', originalFilename: 'test.pdf'},
      })

      const sourceValue = {
        _type: 'image',
        asset: {
          _ref: 'image-1',
          _type: 'reference',
        },
      }
      const schemaTypeAtPath = resolveSchemaTypeForPath(schema.get('author')!, ['profileImage'])
      const transferValueResult = await transferValue({
        sourceRootSchemaType: schemaTypeAtPath!,
        sourcePath: [],
        sourceValue,
        targetRootSchemaType: schema.get('editor')!,
        targetPath: ['profileImageJpeg'],
        options: {
          client: mockClient,
          validateAssets: true,
        },
      })
      expect(transferValueResult.errors.length).toEqual(0)
      expect(transferValueResult?.targetValue).toEqual(sourceValue)
    })

    test('cannot copy image into file objects', async () => {
      const sourceValue = {
        _type: 'image',
        asset: {
          _ref: 'image-e4be7fa20bb20c271060a46bca82b9e84907a13a-320x320-jpg',
          _type: 'reference',
        },
      }
      const schemaTypeAtPath = resolveSchemaTypeForPath(schema.get('author')!, ['profileImage'])
      const transferValueResult = await transferValue({
        sourceRootSchemaType: schemaTypeAtPath!,
        sourcePath: [],
        sourceValue,
        targetRootSchemaType: schema.get('editor')!,
        targetPath: ['profileCV'],
      })
      expect(transferValueResult.errors.length).toEqual(1)
      expect(transferValueResult.errors[0].i18n.key).toEqual(
        'copy-paste.on-paste.validation.image-file-incompatible.description',
      )
    })

    test('can copy weak references into hard references', async () => {
      const sourceValue = {
        _type: 'reference',
        _ref: 'e4be7fa20bb20c271060a46bca82b9e84907a13a-320x320-jpg',
        _weak: true,
      }
      const schemaTypeAtPath = resolveSchemaTypeForPath(schema.get('author')!, ['bestFriend'])
      const transferValueResult = await transferValue({
        sourceRootSchemaType: schemaTypeAtPath!,
        sourcePath: [],
        sourceValue,
        targetRootSchemaType: schema.get('editor')!,
        targetPath: ['bestAuthorFriend'],
      })
      expect(transferValueResult?.targetValue).toEqual(omit(sourceValue, ['_weak']))
    })

    test('can copy hard references into weak references', async () => {
      const sourceValue = {
        _type: 'reference',
        _ref: 'e4be7fa20bb20c271060a46bca82b9e84907a13a-320x320-jpg',
      }
      const schemaTypeAtPath = resolveSchemaTypeForPath(schema.get('editor')!, ['bestAuthorFriend'])
      const transferValueResult = await transferValue({
        sourceRootSchemaType: schemaTypeAtPath!,
        sourcePath: [],
        sourceValue,
        targetRootSchemaType: schema.get('author')!,
        targetPath: ['bestFriend'],
      })
      expect(transferValueResult?.targetValue).toEqual({...sourceValue, _weak: true})
    })

    test('will remove empty reference', async () => {
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
      const transferValueResult = await transferValue({
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
