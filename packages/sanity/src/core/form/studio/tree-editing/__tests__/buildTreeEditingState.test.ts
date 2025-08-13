import {Schema} from '@sanity/schema'
import {type SanityDocumentLike} from '@sanity/types'
import {describe, expect, test} from 'vitest'

import {buildTreeEditingState} from '../utils/build-tree-editing-state/buildTreeEditingState'

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
        {
          type: 'array',
          name: 'mixedArray',
          title: 'Mixed array',
          of: [
            {
              type: 'object',
              name: 'mixedArrayObject',
              title: 'Mixed array object',
              fields: [
                {
                  type: 'string',
                  name: 'title',
                  title: 'Title',
                },
              ],
            },
            {
              name: 'reference',
              type: 'reference',
              title: 'Reference',
              to: [{type: 'testDocument'}],
            },
          ],
        },
        {
          type: 'array',
          name: 'legacyArrayEditingArray',
          title: 'Legacy array editing array',
          options: {
            treeEditing: false,
          },
          of: [
            {
              type: 'object',
              name: 'legacyArrayEditingObject',
              title: 'Legacy array editing object',
              fields: [
                {
                  type: 'string',
                  name: 'title',
                  title: 'Title',
                },
              ],
            },
          ],
        },

        {
          name: 'arrayWithArrayFieldInNestedObjects',
          type: 'array',
          of: [
            {
              type: 'object',
              name: 'firstObject',
              fields: [
                {
                  type: 'object',
                  name: 'secondObject',
                  fields: [
                    {
                      type: 'object',
                      name: 'thirdObject',
                      fields: [
                        {
                          type: 'array',
                          name: 'nestedArray',
                          of: [
                            {
                              type: 'object',
                              name: 'nestedObject',
                              fields: [
                                {
                                  type: 'string',
                                  name: 'nestedString',
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
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
    // implement

    const documentValue: SanityDocumentLike = {
      _id: '123',
      _type: 'testDocument',
      title: 'Test document',
      array1: [
        {
          _key: '123',
          _type: 'array1Object',
          array1Object1String: 'Test string',
          array1Object1Array: [
            {
              _key: '123',
              _type: 'array1Object1Object',
              array1Object1ObjectString: 'Test string',
            },
          ],
          arrayOfPrimitives: ['Test string'],
        },
      ],
    }

    const result = buildTreeEditingState({
      documentValue,
      openPath: ['array1', {_key: '123'}],
      schemaType: schema.get('testDocument'),
    })

    expect(result).toMatchSnapshot()
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
    // Path to the array item
    const result1 = buildTreeEditingState({
      documentValue,
      openPath: ['objectWithArray', 'myArray', {_key: 'key1'}],
      schemaType: schema.get('testDocument'),
    })

    // Path to a primitive field in the array item object should
    // result in the same state as the array item itself
    const result2 = buildTreeEditingState({
      documentValue,
      openPath: ['objectWithArray', 'myArray', {_key: 'key1'}, 'myString'],
      schemaType: schema.get('testDocument'),
    })

    expect(result1).toMatchSnapshot()
    expect(result2).toMatchSnapshot()
  })

  test('should build tree editing state for an object with an array of references', () => {
    const documentValue: SanityDocumentLike = {
      _id: 'testDocument',
      _type: 'testDocument',
      title: 'Test document',
      mixedArray: [
        {
          _key: 'key1',
          _type: 'mixedArrayObject',
          title: 'Mixed array object 1',
        },
        {
          _type: 'reference',
          _key: 'xyz',
          _ref: 'xyz',
        },
      ],
    }

    const result = buildTreeEditingState({
      documentValue,
      openPath: ['mixedArray', {_key: 'key1'}],
      schemaType: schema.get('testDocument'),
    })

    expect(result).toMatchSnapshot()
  })

  test('should not include items that have treeEditing set to false in the schema type options', () => {
    const documentValue: SanityDocumentLike = {
      _id: 'testDocument',
      _type: 'testDocument',
      title: 'Test document',
      legacyArrayEditingArray: [
        {
          _key: '123',
          _type: 'legacyArrayEditingObject',
          title: 'Test string',
        },
      ],
    }

    const result = buildTreeEditingState({
      documentValue,
      openPath: ['legacyArrayEditingArray', {_key: '123'}],
      schemaType: schema.get('testDocument'),
    })

    expect(result).toEqual({
      breadcrumbs: [],
      menuItems: [],
      relativePath: [],
      rootTitle: 'Legacy array editing array',
    })
  })

  test('should build tree editing state for an array with array fields in nested objects', () => {
    const documentValue: SanityDocumentLike = {
      _id: 'testDocument',
      _type: 'testDocument',
      arrayWithArrayFieldInNestedObjects: [
        {
          _key: 'key1',
          _type: 'firstObject',
          secondObject: {
            thirdObject: {
              nestedArray: [
                {
                  _key: 'key2',
                  _type: 'nestedObject',
                  nestedString: 'Nested string',
                },
              ],
            },
          },
        },
      ],
    }

    const result = buildTreeEditingState({
      documentValue,
      openPath: [
        'arrayWithArrayFieldInNestedObjects',
        {_key: 'key1'},
        'secondObject',
        'thirdObject',
        'nestedArray',
        {_key: 'key2'},
      ],
      schemaType: schema.get('testDocument'),
    })

    expect(result).toMatchSnapshot()
  })
})
