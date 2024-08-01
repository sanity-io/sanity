import {beforeAll, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {type TypedObject} from '@sanity/types'
import {omit} from 'lodash'

import {resolveSchemaTypeForPath} from '../resolveSchemaTypeForPath'
import {transferValue} from '../transferValue'
import {createMockClient} from './mockClient'
import {schema} from './schema'

beforeEach(() => {
  jest.resetModules()
  jest.clearAllMocks()
})

beforeAll(() => {
  expect(schema).toBeDefined()
  expect(schema?._validation).toEqual([])
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
      targetRootValue: {},
      targetRootPath: [],
    })
    expect(transferValueResult.errors).not.toEqual([])
    expect(transferValueResult.errors[0].i18n.key).toEqual(
      'copy-paste.on-paste.validation.array-value-incompatible.description',
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
        targetRootValue: {},
        targetRootPath: [],
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
        targetRootValue: {},
        targetRootPath: [],
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
        targetRootValue: {},
        targetRootPath: [],
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
        targetRootValue: {},
        targetRootPath: [],
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
        targetRootValue: {},
        targetRootPath: [],
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
        targetRootValue: {},
        targetRootPath: [],
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
        targetRootValue: {},
        targetRootPath: [],
      })
      expect(transferValueResult?.targetValue).toEqual({_type: 'reference', _ref: 'yyy'})
    })
    test('can copy reference where referenced document does match string filter', async () => {
      const sourceValue = {
        _type: 'referencesDocument',
        _id: 'xxx',
        reference: {_type: 'reference', _ref: 'yyy'},
      }
      const transferValueResult = await transferValue({
        sourceRootSchemaType: schema.get('referencesDocument')!,
        sourcePath: ['reference'],
        sourceValue,
        targetRootSchemaType: schema.get('referencesDocument')!,
        targetPath: ['referenceWithFilter'],
        targetRootValue: {},
        targetRootPath: ['referenceWithFilter'],
        options: {
          validateReferences: true,
          client: createMockClient([{_type: 'editor', _id: 'yyy', name: 'yyy'}]),
        },
      })
      expect(transferValueResult?.errors).toEqual([])
      expect(transferValueResult?.targetValue).toEqual({_ref: 'yyy', _type: 'reference'})
    })

    test('can copy reference where referenced document does match filter function', async () => {
      const sourceValue = {_type: 'reference', _ref: 'book-1'}
      const targetRootValue = {
        _type: 'referencesDocument',
        _id: 'xxx',
        decadeFilteredBook: {
          decade: 1980,
        },
      }
      const transferValueResult = await transferValue({
        sourceRootSchemaType: schema.get('referencesDocument')!,
        sourcePath: [],
        sourceValue,
        targetRootSchemaType: schema.get('referencesDocument')!,
        targetPath: ['decadeFilteredBook', 'book'],
        targetRootValue,
        targetRootPath: ['decadeFilteredBook', 'book'],
        options: {
          validateReferences: true,
          client: createMockClient([
            {_type: 'book', _id: 'book-1', title: 'Book 1', publicationYear: 1981},
            {_type: 'book', _id: 'book-2', title: 'Book 2', publicationYear: 1991},
          ]),
        },
      })
      expect(transferValueResult?.errors).toEqual([])
      expect(transferValueResult?.targetValue).toEqual({_ref: 'book-1', _type: 'reference'})
    })

    test('will not copy reference into another that doesnt accept type', async () => {
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
        targetRootValue: {},
        targetRootPath: [],
        options: {
          validateReferences: true,
          client: createMockClient([{_type: 'author', _id: 'yyy'}]),
        },
      })
      expect(transferValueResult?.errors.length).toEqual(1)
      expect(transferValueResult?.targetValue).toEqual(undefined)
    })

    test('will not copy reference where target does not accept string filter', async () => {
      const sourceValue = {
        _type: 'referencesDocument',
        _id: 'xxx',
        reference: {_type: 'reference', _ref: 'yyy'},
      }
      const targetRootValue = {
        _type: 'referencesDocument',
        _id: 'zzz',
      }

      const transferValueResult = await transferValue({
        sourceRootSchemaType: schema.get('referencesDocument')!,
        sourcePath: ['reference'],
        sourceValue,
        targetRootSchemaType: schema.get('referencesDocument')!,
        targetPath: ['referenceWithFilter'],
        targetRootValue,
        targetRootPath: ['referenceWithFilter'],
        options: {
          validateReferences: true,
          client: createMockClient([{_type: 'editor', _id: 'yyy', name: 'John Doe'}]),
        },
      })
      expect(transferValueResult?.errors).toEqual([
        {
          level: 'error',
          sourceValue: expect.any(Object),

          i18n: {
            key: 'copy-paste.on-paste.validation.reference-filter-incompatible.description',
          },
        },
      ])
      expect(transferValueResult?.targetValue).toEqual(undefined)
    })

    test('will not copy reference where reference does not match filter function', async () => {
      const sourceValue = {_type: 'reference', _ref: 'book-2'}
      const targetRootValue = {
        _type: 'referencesDocument',
        _id: 'xxx',
        decadeFilteredBook: {
          decade: 1980,
        },
      }
      const transferValueResult = await transferValue({
        sourceRootSchemaType: schema.get('referencesDocument')!,
        sourcePath: [],
        sourceValue,
        targetRootSchemaType: schema.get('referencesDocument')!,
        targetPath: ['decadeFilteredBook', 'book'],
        targetRootValue,
        targetRootPath: ['decadeFilteredBook', 'book'],
        options: {
          validateReferences: true,
          client: createMockClient([
            {_type: 'book', _id: 'book-1', title: 'Book 1', publicationYear: 1981},
            {_type: 'book', _id: 'book-2', title: 'Book 2', publicationYear: 1991},
          ]),
        },
      })
      expect(transferValueResult?.errors).toEqual([
        {
          level: 'error',
          sourceValue: expect.any(Object),

          i18n: {
            key: 'copy-paste.on-paste.validation.reference-filter-incompatible.description',
          },
        },
      ])
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
        targetRootValue: {},
        targetRootPath: [],
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
        targetRootValue: {},
        targetRootPath: [],
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
        targetRootValue: {},
        targetRootPath: [],
      })
      expect(transferValueResult?.targetValue).toMatchObject({
        _type: 'object',
        isFavorite: false,
      })
    })

    test('can copy booleans inside documents', async () => {
      const sourceValue = {
        _type: 'editor',
        _id: 'xxx',
        isVerified: false,
      }
      const transferValueResult = await transferValue({
        sourceRootSchemaType: schema.get('editor')!,
        sourcePath: [],
        sourceValue,
        targetRootSchemaType: schema.get('editor')!,
        targetPath: [],
        targetRootValue: {},
        targetRootPath: [],
      })
      expect(transferValueResult?.errors.length).toEqual(0)
      expect(transferValueResult?.targetValue).toMatchObject({
        _type: 'editor',
        isVerified: false,
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
        targetRootValue: {},
        targetRootPath: [],
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
        targetRootValue: {},
        targetRootPath: [],
      })
      expect(transferValueResult?.targetValue).toEqual(['Alice', 'Bob', 'Charlie'])
    })
    test('can copy pte values with custom markers', async () => {
      const sourceValue = [
        {
          _key: '2291402e9364',
          _type: 'block',
          children: [
            {
              _key: '4bd1b8513714',
              _type: 'span',
              marks: [],
              text: 'dsafadsfds',
            },
          ],
          markDefs: [],
          style: 'normal',
        },
        {
          _key: '702747444e69',
          _type: 'block',
          children: [
            {
              _key: 'd373eb211a66',
              _type: 'span',
              marks: ['0fb5eb9f09b4'],
              text: 'ewr',
            },
          ],
          markDefs: [{_key: '0fb5eb9f09b4', _type: 'hyperlink'}],
          style: 'normal',
        },
        {
          _key: '02bb994c6a40',
          _type: 'block',
          children: [
            {
              _key: '290c117abcda',
              _type: 'span',
              marks: ['0fb5eb9f09b4'],
              text: 'n.',
            },
          ],
          markDefs: [{_key: '0fb5eb9f09b4', _type: 'hyperlink'}],
          style: 'normal',
        },
      ]
      const expectedOutput = [
        {
          _key: expect.any(String),
          _type: 'block',
          children: [
            {
              _key: expect.any(String),
              _type: 'span',
              text: 'dsafadsfds',
            },
          ],
          style: 'normal',
        },
        {
          _key: expect.any(String),
          _type: 'block',
          children: [
            {
              _key: expect.any(String),
              _type: 'span',
              marks: [expect.any(String)],
              text: 'ewr',
            },
          ],
          markDefs: [{_key: expect.any(String), _type: 'hyperlink'}],
          style: 'normal',
        },
        {
          _key: expect.any(String),
          _type: 'block',
          children: [
            {
              _key: expect.any(String),
              _type: 'span',
              marks: [expect.any(String)],
              text: 'n.',
            },
          ],
          markDefs: [{_key: expect.any(String), _type: 'hyperlink'}],
          style: 'normal',
        },
      ]
      const sourceRootSchemaType = resolveSchemaTypeForPath(schema.get('pte_customMarkers')!, [
        'content',
      ])!
      const transferValueResult = await transferValue({
        sourceRootSchemaType,
        sourcePath: [],
        sourceValue,
        targetRootSchemaType: resolveSchemaTypeForPath(schema.get('pte_customMarkers')!, [
          'content',
        ])!,
        targetPath: [],
        targetRootValue: {},
        targetRootPath: [],
      })
      expect(transferValueResult?.errors).toEqual([])
      expect(transferValueResult?.targetValue).toEqual(expectedOutput)
      // @ts-expect-error We already know this is coming from a block
      expect(transferValueResult?.targetValue[1].children[0].marks[0]).toEqual(
        // @ts-expect-error We already know this is coming from a block
        transferValueResult?.targetValue[1].markDefs[0]._key,
      )
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
        targetRootValue: {},
        targetRootPath: [],
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
        targetRootValue: {},
        targetRootPath: [],
      })
      expect(transferValueResult?.targetValue).toEqual([
        {_key: expect.any(String), title: 'Red', name: 'red', _type: 'color'},
        {_key: expect.any(String), title: 'Blue', name: 'blue', _type: 'color'},
      ])
    })

    test('can copy an supported object into an array of multiple types', async () => {
      const sourceValue = {
        title: 'Red',
        name: 'red',
      }
      const schemaTypeAtPath = resolveSchemaTypeForPath(schema.get('editor')!, [
        'colorWithLongTitle',
      ])
      const transferValueResult = await transferValue({
        sourceRootSchemaType: schemaTypeAtPath!,
        sourcePath: [],
        sourceRootPath: ['color'],
        sourceValue,
        targetRootSchemaType: schema.get('editor')!,
        targetPath: ['arrayOfPredefinedOptions'],
        targetRootValue: {},
        targetRootPath: [],
      })
      expect(transferValueResult?.targetValue).toEqual([
        {_key: expect.any(String), title: 'Red', name: 'red', _type: 'color'},
      ])
    })

    test('can not copy array values into another array that does not accept type', async () => {
      const sourceValue = [
        {
          _type: 'color',
          _key: '39fd2dd21625',
          title: 'Hello there',
          name: 'Fred',
        },
      ]
      const transferValueResult = await transferValue({
        sourceRootSchemaType: schema.get('editor')!,
        sourcePath: ['arrayOfMultipleNestedTypes'],
        sourceValue,
        targetRootSchemaType: schema.get('editor')!,
        targetPath: ['arrayOfMultipleNestedTypesWithoutColor'],
        targetRootValue: {},
        targetRootPath: [],
        // targetValue,
      })
      expect(transferValueResult?.errors).not.toEqual([])
      expect(transferValueResult?.targetValue).toEqual(undefined)
    })
    test('can not copy array values into another nested array that does not accept type', async () => {
      const sourceValue = [
        {
          _type: 'house',
          _key: '39fd2dd21625',
          title: 'Hello there',
          name: 'Fred',
        },
      ]
      const transferValueResult = await transferValue({
        sourceRootSchemaType: schema.get('editor')!,
        sourcePath: ['arrayOfMultipleNestedTypes', {_key: '39fd2dd21625'}],
        sourceValue,
        targetRootSchemaType: schema.get('editor')!,
        targetPath: ['arrayOfMultipleNestedTypes', {_key: '39fd2dd21625'}, 'nestedArray'],
        targetRootValue: {},
        targetRootPath: [],
      })
      expect(transferValueResult?.errors).not.toEqual([])
      expect(transferValueResult?.targetValue).toEqual(undefined)
    })
    test('can not copy array objects values into another nested primitive array that does not accept type', async () => {
      const sourceValue = [{_key: 'c9b6815500b1', _type: 'mbwEvent', where: 'Hello'}]
      const schemaTypeAtPath = resolveSchemaTypeForPath(schema.get('objects')!, ['events'])
      const targetValue = {
        _id: 'xxx',
        type: 'objects',
        events: [{_key: 'c9b6815500b1', _type: 'mbwEvent', where: 'Hello'}],
      }
      const transferValueResult = await transferValue({
        // sourceRootSchemaType: schema.get('objects')!,
        sourceRootSchemaType: schemaTypeAtPath!,
        sourcePath: [],
        sourceValue,
        targetRootSchemaType: schema.get('objects')!,
        targetPath: ['events', {_key: 'c9b6815500b1'}, 'what'],
        targetRootValue: {},
        targetRootPath: [],
        targetValue,
      })
      expect(transferValueResult?.errors).not.toEqual([])
      expect(transferValueResult?.targetValue).toEqual(undefined)
    })
    test('can copy array values into another nested array that does accept type', async () => {
      const sourceValue = [
        {
          _type: 'color',
          _key: '39fd2dd21625',
          title: 'Hello there',
          name: 'Fred',
        },
      ]
      const sourceRootSchemaType = resolveSchemaTypeForPath(schema.get('editor')!, [
        'arrayOfMultipleNestedTypes',
      ])!
      const transferValueResult = await transferValue({
        sourceRootSchemaType,
        sourcePath: [],
        sourceValue,
        targetRootSchemaType: schema.get('editor')!,
        targetPath: ['arrayOfMultipleNestedTypes', {_key: '39fd2dd21625'}, 'nestedArray'],
        targetRootValue: {},
        targetRootPath: [],
        //targetValue: [],
      })
      expect(transferValueResult?.errors).toEqual([])
      expect(transferValueResult?.targetValue).toEqual([
        {_key: expect.any(String), title: 'Hello there', name: 'Fred', _type: 'color'},
      ])
    })
    test('can copy array into a deeply nested array inside object', async () => {
      const sourceValue = [
        {
          _type: 'color',
          _key: '39fd2dd21625',
          title: 'Hello there',
          name: 'Fred',
        },
      ]
      const targetValue = [
        {
          _type: 'color',
          _key: '39fd2dd21625',
          title: 'Hello there',
          name: 'Fred',
        },
      ]
      const sourceRootSchemaType = resolveSchemaTypeForPath(schema.get('editor')!, [
        'arrayOfPredefinedOptions',
      ])!
      const transferValueResult = await transferValue({
        sourceRootSchemaType,
        sourcePath: [],
        sourceValue,
        targetRootSchemaType: schema.get('editor')!,
        targetPath: ['arrayOfMultipleNestedTypes', {_key: 'color-1'}, 'nestedArray'],
        targetRootValue: {},
        targetRootPath: [],
      })
      expect(transferValueResult?.errors).toEqual([])
      expect(transferValueResult?.targetValue).toEqual([
        {_key: expect.any(String), title: 'Hello there', name: 'Fred', _type: 'color'},
      ])
    })

    test('can copy array values with objects with read-only properties into another array that does accept type', async () => {
      const sourceValue = [
        {
          _key: '01fab2296a40',
          _type: 'hotspot',
          details: 'New Hotspot at 20% x 47.83%',
          x: 20,
          y: 47.83,
        },
        {
          _key: '543baa938baf',
          _type: 'hotspot',
          details: 'New Hotspot at 54% x 48%',
          x: 54.51,
          y: 46.08,
        },
        {
          _key: '0e7c1fb080c4',
          _type: 'hotspot',
          details: 'booper\n',
          x: 31.33,
          y: 56.25,
        },
        {
          _key: '8c966cc5aef8',
          _type: 'hotspot',
          details: 'New Hotspot at 72.17% x 31.67%',
          x: 72.17,
          y: 31.67,
        },
        {
          _key: '14fa20f16bbc',
          _type: 'hotspot',
          details: 'New Hotspot at 37.5% x 29.17%',
          x: 37.5,
          y: 29.17,
        },
        {
          _key: 'cde6ac018ff2',
          _type: 'hotspot',
          details: 'New Hotspot at 82.83% x 79.67%',
          x: 34.67,
          y: 79.62,
        },
      ]
      const expectValue = sourceValue.map((item) => ({
        ...item,
        _key: expect.any(String),
      }))
      const schemaTypeAtPath = resolveSchemaTypeForPath(schema.get('hotspotDocument')!, [
        'hotspots',
      ])
      const transferValueResult = await transferValue({
        sourceRootSchemaType: schemaTypeAtPath!,
        sourcePath: [],
        sourceValue,
        targetRootSchemaType: schema.get('hotspotDocument')!,
        targetPath: ['hotspots'],
        targetRootValue: {},
        targetRootPath: [],
      })
      expect(transferValueResult.errors).toEqual([])
      expect(transferValueResult?.targetValue).toEqual(expectValue)
    })

    test('can copy array of weak references from create new action', async () => {
      const sourceValue = [
        {
          _type: 'reference',
          _key: '572199919d45',
          _ref: '26e2c49c-9e7a-4ece-9b63-c5b3157856b1',
          _weak: true,
          _strengthenOnPublish: {
            type: 'author',
            template: {id: 'author'},
          },
        },
      ]
      const expectedOutput = [
        {
          _type: 'reference',
          _key: expect.any(String),
          _ref: '26e2c49c-9e7a-4ece-9b63-c5b3157856b1',
          _weak: true,
          _strengthenOnPublish: {
            type: 'author',
            template: {id: 'author'},
          },
        },
      ]
      const sourceRootSchemaType = resolveSchemaTypeForPath(schema.get('referencesDocument')!, [
        'arrayOfReferences',
      ])!
      const transferValueResult = await transferValue({
        sourceRootSchemaType,
        sourcePath: [],
        sourceValue,
        targetRootSchemaType: resolveSchemaTypeForPath(schema.get('referencesDocument')!, [
          'arrayOfReferences',
        ])!,
        targetPath: [],
        targetRootValue: {},
        targetRootPath: [],
      })
      expect(transferValueResult?.errors).toEqual([])
      expect(transferValueResult?.targetValue).toEqual(expectedOutput)
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
        targetRootValue: {},
        targetRootPath: [],
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
        targetRootValue: {},
        targetRootPath: [],
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
        targetRootValue: {},
        targetRootPath: [],
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
        targetRootValue: {},
        targetRootPath: [],
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
        targetRootValue: {},
        targetRootPath: [],
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
        targetRootValue: {},
        targetRootPath: [],
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
        targetRootValue: {},
        targetRootPath: [],
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
        targetRootValue: {},
        targetRootPath: [],
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

    test('can copy nested objects', async () => {
      const sourceValue = {_type: 'nestedObject', _key: 'yyy', title: 'item', items: []}
      const schemaTypeAtPath = resolveSchemaTypeForPath(schema.get('author')!, ['nestedTest'])
      const transferValueResult = await transferValue({
        sourceRootSchemaType: schemaTypeAtPath!,
        sourcePath: [],
        sourceValue,
        targetRootSchemaType: schema.get('editor')!,
        targetPath: ['nestedTest'],
        targetRootValue: {},
        targetRootPath: [],
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
        targetRootValue: {},
        targetRootPath: [],
      })
      expect(transferValueResult?.errors).toEqual([])
      expect(transferValueResult?.targetValue).toEqual(sourceValue)
    })

    test('will validate image objects', async () => {
      const mockClient = createMockClient([
        {
          _id: 'image-1',
          _type: 'sanity.imageAsset',
          mimeType: 'image/jpeg',
          originalFilename: 'test.jpg',
        },
        {
          _id: 'file-1',
          _type: 'sanity.fileAsset',
          mimeType: 'application/pdf',
          originalFilename: 'test.pdf',
        },
      ])

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
        targetRootValue: {},
        targetRootPath: [],
        options: {
          client: mockClient,
          validateAssets: true,
        },
      })
      // expect(transferValueResult?.targetValue).toEqual(sourceValue)
      expect(transferValueResult.errors).not.toEqual([])
      expect(transferValueResult.errors[0].i18n.key).toEqual(
        'copy-paste.on-paste.validation.mime-type-incompatible.description',
      )
    })

    test('will paste image into field that accepts same mime type', async () => {
      const mockClient = createMockClient([
        {
          _id: 'image-1',
          _type: 'sanity.imageAsset',
          mimeType: 'image/jpeg',
          originalFilename: 'test.jpg',
        },
        {
          _id: 'file-1',
          _type: 'sanity.fileAsset',
          mimeType: 'application/pdf',
          originalFilename: 'test.pdf',
        },
      ])

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
        targetRootValue: {},
        targetRootPath: [],
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
        targetRootSchemaType: resolveSchemaTypeForPath(schema.get('author')!, ['profileCV'])!,
        targetPath: [],
        targetRootValue: {},
        targetRootPath: [],
      })
      expect(transferValueResult.errors).not.toEqual([])
      expect(transferValueResult.errors[0].i18n.key).toEqual(
        'copy-paste.on-paste.validation.image-file-incompatible.description',
      )
    })

    test('cannot copy file into image objects', async () => {
      const sourceValue = {
        _type: 'file',
        asset: {
          _ref: 'file-e4be7fa20bb20c271060a46bca82b9e84907a13a-pdf',
          _type: 'reference',
        },
      }
      const schemaTypeAtPath = resolveSchemaTypeForPath(schema.get('author')!, ['profileCV'])
      const transferValueResult = await transferValue({
        sourceRootSchemaType: schemaTypeAtPath!,
        sourcePath: [],
        sourceValue,
        targetRootSchemaType: resolveSchemaTypeForPath(schema.get('author')!, ['profileImage'])!,
        targetPath: [],
        targetRootValue: {},
        targetRootPath: [],
      })
      expect(transferValueResult.errors).not.toEqual([])
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
        targetRootValue: {},
        targetRootPath: [],
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
        targetRootValue: {},
        targetRootPath: [],
      })
      expect(transferValueResult?.targetValue).toEqual({...sourceValue, _weak: true})
    })

    test('should not remove empty reference', async () => {
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
        targetRootValue: {},
        targetRootPath: [],
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
          {
            _key: expect.any(String),
            _type: 'reference',
          },
        ],
      })
      // Test that the keys are not the same
      expect(targetValue.bio[0]._key).not.toEqual('someKey')
      expect(targetValue.bio[0].children[0]._key).not.toEqual('someOtherKey')
      expect(targetValue.bio[1]._type).toEqual('reference')
      expect(targetValue.bio.length).toEqual(2)
    })
  })
})
