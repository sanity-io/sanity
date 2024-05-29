import {describe, expect, test} from '@jest/globals'
import {Schema} from '@sanity/schema'
import {type SanityDocumentLike} from 'sanity'

import {buildTreeEditingState, type TreeEditingState} from '../utils'

const schema = Schema.compile({
  name: 'default',
  types: [
    {
      name: 'testDocument',
      title: 'Document',
      type: 'document',
      fields: [
        {
          type: 'string',
          name: 'title',
          title: 'Title',
        },
        {
          type: 'object',
          name: 'objectWithArray',
          title: 'Object with array',
          fields: [
            {
              type: 'array',
              name: 'myArray',
              title: 'Array',
              of: [
                {
                  type: 'object',
                  name: 'myObject',
                  title: 'Object',
                  fields: [
                    {
                      type: 'string',
                      name: 'myString',
                      title: 'String',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'array',
          name: 'array1',
          title: 'Array 1',
          of: [
            {
              type: 'object',
              name: 'array1Object',
              title: 'Array 1 object 1',
              fields: [
                {
                  type: 'string',
                  name: 'array1Object1String',
                  title: 'Array 1 Object 1 String',
                },
                {
                  type: 'array',
                  name: 'array1Object1Array',
                  title: 'Array 1 Object 1 Array',
                  of: [
                    {
                      type: 'object',
                      name: 'array1Object1Object',
                      title: 'Array 1 Object 1 Object',
                      fields: [
                        {
                          type: 'string',
                          name: 'array1Object1ObjectString',
                          title: 'Array 1 Object 1 Object String',
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'array',
                  name: 'arrayOfPrimitives',
                  title: 'Array of primitives',
                  of: [{type: 'string'}],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
})

describe('tree-editing: buildTreeEditingState', () => {
  test('should build tree editing state for an array of objects', () => {
    const documentValue: SanityDocumentLike = {
      _id: 'testDocument',
      _type: 'testDocument',
      title: 'Test document',
      arrayOfPrimitives: ['string1', 'string2', 'string3'],
      array1: [
        {
          _key: 'key1',
          _type: 'array1Object',
          array1Object1String: 'My string 1',
        },
        {
          _key: 'key2',
          _type: 'array1Object',
          array1Object1String: 'My string 2',
        },
        {
          _key: 'key3',
          _type: 'array1Object',
          array1Object1String: 'My string 3',
          array1Object1Array: [
            {
              _key: 'key4',
              _type: 'array1Object1Object',
              array1Object1ObjectString: 'My string 4',
            },
            {
              _key: 'key5',
              _type: 'array1Object1Object',
              array1Object1ObjectString: 'My string 5',
            },
          ],
        },
        {
          _key: 'key6',
          _type: 'array1Object',
          array1Object1String: 'My string 6',
        },
        {
          _key: 'key7',
          _type: 'array1Object',
          array1Object1String: 'My string 7',
          array1Object1Array: [
            {
              _key: 'key8',
              _type: 'array1Object1Object',
              array1Object1ObjectString: 'My string 8',
            },
            {
              _key: 'key9',
              _type: 'array1Object1Object',
              array1Object1ObjectString: 'My string 9',
            },
          ],
        },
      ],
    }

    const schemaType = schema.get('testDocument')

    const expectedResult: TreeEditingState = {
      breadcrumbs: [
        {
          path: ['array1', {_key: 'key1'}],
          title: 'My string 1',
          parentArrayTitle: 'Array 1',
          children: [
            {
              parentArrayTitle: 'Array 1',
              path: ['array1', {_key: 'key1'}],
              title: 'My string 1',
              children: [],
            },
            {
              parentArrayTitle: 'Array 1',
              path: ['array1', {_key: 'key2'}],
              title: 'My string 2',
              children: [],
            },
            {
              parentArrayTitle: 'Array 1',
              path: ['array1', {_key: 'key3'}],
              title: 'My string 3',
              children: [],
            },
            {
              parentArrayTitle: 'Array 1',
              path: ['array1', {_key: 'key6'}],
              title: 'My string 6',
              children: [],
            },
            {
              parentArrayTitle: 'Array 1',
              path: ['array1', {_key: 'key7'}],
              title: 'My string 7',
              children: [],
            },
          ],
        },
      ],
      menuItems: [
        {
          title: 'My string 1',
          parentTitle: 'Array 1',
          path: ['array1', {_key: 'key1'}],
          children: [],
        },
        {
          title: 'My string 2',
          parentTitle: 'Array 1',
          path: ['array1', {_key: 'key2'}],
          children: [],
        },
        {
          title: 'My string 3',
          parentTitle: 'Array 1',
          path: ['array1', {_key: 'key3'}],
          children: [
            {
              title: 'Array 1 Object 1 Array',
              parentTitle: 'My string 3',
              path: ['array1', {_key: 'key3'}, 'array1Object1Array'],
              children: [
                {
                  parentTitle: 'Array 1 Object 1 Array',
                  path: ['array1', {_key: 'key3'}, 'array1Object1Array', {_key: 'key4'}],
                  title: 'My string 4',
                  children: [],
                },
                {
                  parentTitle: 'Array 1 Object 1 Array',
                  path: ['array1', {_key: 'key3'}, 'array1Object1Array', {_key: 'key5'}],
                  title: 'My string 5',
                  children: [],
                },
              ],
            },
          ],
        },
        {
          title: 'My string 6',
          parentTitle: 'Array 1',
          path: ['array1', {_key: 'key6'}],
          children: [],
        },
        {
          title: 'My string 7',
          parentTitle: 'Array 1',
          path: ['array1', {_key: 'key7'}],
          children: [
            {
              title: 'Array 1 Object 1 Array',
              parentTitle: 'My string 7',
              path: ['array1', {_key: 'key7'}, 'array1Object1Array'],
              children: [
                {
                  parentTitle: 'Array 1 Object 1 Array',
                  path: ['array1', {_key: 'key7'}, 'array1Object1Array', {_key: 'key8'}],
                  title: 'My string 8',
                  children: [],
                },
                {
                  parentTitle: 'Array 1 Object 1 Array',
                  path: ['array1', {_key: 'key7'}, 'array1Object1Array', {_key: 'key9'}],
                  title: 'My string 9',
                  children: [],
                },
              ],
            },
          ],
        },
      ],
      relativePath: ['array1', {_key: 'key1'}],
      rootTitle: 'Array 1',
    }

    // Path to the array item
    const result1 = buildTreeEditingState({
      documentValue,
      openPath: ['array1', {_key: 'key1'}],
      schemaType,
    })

    // Path to a primitive field in the array item object should
    // result in the same state as the array item itself
    const result2 = buildTreeEditingState({
      documentValue,
      openPath: ['array1', {_key: 'key1'}, 'array1Object1String'],
      schemaType,
    })

    expect(result1).toEqual(expectedResult)
    expect(result2).toEqual(expectedResult)
  })

  test('should build tree editing state for an object with an array', () => {
    const documentValue: SanityDocumentLike = {
      _id: 'testDocument',
      _type: 'testDocument',
      title: 'Test document',
      objectWithArray: {
        myArray: [
          {
            _key: 'key1',
            _type: 'myObject',
            myString: 'My string 1',
          },
        ],
      },
    }

    const schemaType = schema.get('testDocument')

    const expectedResult: TreeEditingState = {
      breadcrumbs: [
        {
          path: ['objectWithArray', 'myArray', {_key: 'key1'}],
          title: 'My string 1',
          parentArrayTitle: 'Array',
          children: [
            {
              parentArrayTitle: 'Array',
              path: ['objectWithArray', 'myArray', {_key: 'key1'}],
              title: 'My string 1',
              children: [],
            },
          ],
        },
      ],
      menuItems: [
        {
          title: 'My string 1',
          parentTitle: 'Array',
          path: ['objectWithArray', 'myArray', {_key: 'key1'}],
          children: [],
        },
      ],
      relativePath: ['objectWithArray', 'myArray', {_key: 'key1'}],
      rootTitle: 'Array',
    }

    // Path to the array item
    const result1 = buildTreeEditingState({
      documentValue,
      openPath: ['objectWithArray', 'myArray', {_key: 'key1'}],
      schemaType,
    })

    // Path to a primitive field in the array item object should
    // result in the same state as the array item itself
    const result2 = buildTreeEditingState({
      documentValue,
      openPath: ['objectWithArray', 'myArray', {_key: 'key1'}, 'myString'],
      schemaType,
    })

    expect(result1).toEqual(expectedResult)
    expect(result2).toEqual(expectedResult)
  })
})
