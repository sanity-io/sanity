import {Schema} from '@sanity/schema'
import {type SanityDocumentLike} from '@sanity/types'
import {describe, expect, test} from 'vitest'

import {buildTreeEditingState} from '../utils'

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

  test('should build tree editing state for an array of objects with portable text fields', () => {
    const documentValue: SanityDocumentLike = {
      _id: 'testDocument',
      _type: 'testDocument',
      title: 'Test document',
      body: [
        {
          _key: 'c614ac1e3936',
          _type: 'block',
          children: [
            {
              _key: '4734df0cfa0e',
              _type: 'span',
              marks: [],
              text: 'a default text box',
            },
          ],
          markDefs: [],
          style: 'normal',
        },
        {
          _key: 'd9acf38fa0ad',
          _type: 'block',
          children: [
            {
              _key: '828103cde822',
              _type: 'span',
              marks: [],
              text: 'a nother thest',
            },
          ],
          markDefs: [],
          style: 'normal',
        },
        {
          _key: 'fdcb664a0741',
          _type: 'object1',
          description: [
            {
              _key: '7e9c9bb83dea',
              _type: 'block',
              children: [
                {
                  _key: '68b22e8cc0b0',
                  _type: 'span',
                  marks: [],
                  text: 'Does this work',
                },
              ],
              markDefs: [],
              style: 'normal',
            },
            {
              _key: 'b0a0ffb738a4',
              _type: 'object2',
              item: [
                {
                  _key: '4ace7101c352',
                  _type: 'property',
                  title: 'wooo',
                },
              ],
            },
          ],
          name: 'woohoo',
        },
        {
          _key: 'd642acc3698d',
          _type: 'object1',
          description: [
            {
              _key: '84fcf9146211',
              _type: 'block',
              children: [
                {
                  _key: 'a89b1f95024f',
                  _type: 'span',
                  marks: [],
                  text: 'Wooo',
                },
              ],
              markDefs: [],
              style: 'normal',
            },
            {
              _key: '22c36253db69',
              _type: 'object2',
              item: [
                {
                  _key: '8c993b716215',
                  _type: 'property',
                  // eslint-disable-next-line camelcase
                  description_two: [
                    {
                      _key: '981f3db981d8',
                      _type: 'block',
                      children: [
                        {
                          _key: 'a420b9412088',
                          _type: 'span',
                          marks: [],
                          text: 'abcas',
                        },
                      ],
                      markDefs: [],
                      style: 'normal',
                    },
                    {
                      _key: '3483ab85466e',
                      _type: 'object2',
                      // eslint-disable-next-line camelcase
                      item_two: [
                        {
                          _key: '6dd0be61a480',
                          _type: 'object3',
                          // eslint-disable-next-line camelcase
                          description_three: [
                            {
                              _key: '1513b024fca5',
                              _type: 'block',
                              children: [
                                {
                                  _key: '415122346325',
                                  _type: 'span',
                                  marks: [],
                                  text: 'abodasd',
                                },
                              ],
                              markDefs: [],
                              style: 'normal',
                            },
                            {
                              _key: '8a2392617e21',
                              _type: 'object3',
                              // eslint-disable-next-line camelcase
                              title_three: 'adas',
                            },
                          ],
                          // eslint-disable-next-line camelcase
                          title_two: 'Ahhh',
                        },
                      ],
                    },
                  ],
                  title: 'Boop!',
                },
              ],
            },
          ],
          name: 'A Shark!',
        },
      ],
      fieldsetArray: [
        {
          _key: '0732e5cd8ccd',
          _type: 'myObject',
          array: [
            {
              _key: '837a3a4e51bc',
              _type: 'myObject',
            },
          ],
        },
        {
          _key: '44942129ba11',
          _type: 'myObject',
          string: 'ok',
        },
      ],
    }

    const result = buildTreeEditingState({
      documentValue,
      openPath: ['body', {_key: 'c614ac1e3936'}, 'children', {_key: '4734df0cfa0e'}],
      schemaType: schema.get('testDocument'),
    })

    expect(result).toMatchSnapshot()
  })
})
