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
  test('should build tree editing state for a document with an array of objects', () => {
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
          children: [
            {
              path: ['array1', {_key: 'key1'}],
              title: 'My string 1',
              children: [],
            },
            {
              path: ['array1', {_key: 'key2'}],
              title: 'My string 2',
              children: [],
            },
            {
              path: ['array1', {_key: 'key3'}],
              title: 'My string 3',
              children: [],
            },
            {
              path: ['array1', {_key: 'key6'}],
              title: 'My string 6',
              children: [],
            },
            {
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
          path: ['array1', {_key: 'key1'}],
          children: [],
        },
        {
          title: 'My string 2',
          path: ['array1', {_key: 'key2'}],
          children: [],
        },
        {
          title: 'My string 3',
          path: ['array1', {_key: 'key3'}],
          children: [
            {
              title: 'Array 1 Object 1 Array',
              path: ['array1', {_key: 'key3'}, 'array1Object1Array'],
              children: [
                {
                  path: ['array1', {_key: 'key3'}, 'array1Object1Array', {_key: 'key4'}],
                  title: 'My string 4',
                  children: [],
                },
                {
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
          path: ['array1', {_key: 'key6'}],
          children: [],
        },
        {
          title: 'My string 7',
          path: ['array1', {_key: 'key7'}],
          children: [
            {
              title: 'Array 1 Object 1 Array',
              path: ['array1', {_key: 'key7'}, 'array1Object1Array'],
              children: [
                {
                  path: ['array1', {_key: 'key7'}, 'array1Object1Array', {_key: 'key8'}],
                  title: 'My string 8',
                  children: [],
                },
                {
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

    const result1 = buildTreeEditingState({
      documentValue,
      focusPath: ['array1', {_key: 'key1'}],
      schemaType,
    })

    const result2 = buildTreeEditingState({
      documentValue,
      focusPath: ['array1', {_key: 'key1'}, 'array1Object1String'],
      schemaType,
    })

    expect(result1).toEqual(expectedResult)
    expect(result2).toEqual(expectedResult)
  })
})
