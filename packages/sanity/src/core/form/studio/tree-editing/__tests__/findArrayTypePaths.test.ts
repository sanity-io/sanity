import {Schema} from '@sanity/schema'
import {describe, expect, test} from 'vitest'

import {findArrayTypePaths} from '../utils/findArrayTypePaths'

const schema = Schema.compile({
  name: 'default',
  types: [
    {
      name: 'testDocument',
      title: 'Document',
      type: 'document',
      fields: [
        {
          type: 'object',
          name: 'rootObject',
          fields: [
            {
              type: 'object',
              name: 'nestedObject0',
              fields: [{type: 'string', name: 'string'}],
            },
            {
              type: 'object',
              name: 'nestedObject1',
              fields: [
                {
                  type: 'object',
                  name: 'nestedObject2',
                  fields: [
                    {
                      type: 'array',
                      name: 'nestedArray0',
                      of: [
                        {
                          type: 'object',
                          name: 'arrayObject',
                          fields: [
                            {
                              type: 'string',
                              name: 'string',
                            },
                          ],
                        },
                      ],
                    },
                    {
                      type: 'object',
                      name: 'nestedObject3',
                      fields: [
                        {
                          type: 'array',
                          name: 'nestedArray1',
                          of: [
                            {
                              type: 'object',
                              name: 'arrayObject',
                              fields: [
                                {
                                  type: 'string',
                                  name: 'string',
                                },
                              ],
                            },
                          ],
                        },

                        {
                          type: 'array',
                          name: 'nestedArray2',
                          of: [
                            {
                              type: 'object',
                              name: 'arrayObject',
                              fields: [
                                {
                                  type: 'string',
                                  name: 'string',
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

        {
          type: 'object',
          name: 'objectWithoutArrays',
          fields: [
            {
              type: 'object',
              name: 'nestedObject',
              fields: [
                {
                  type: 'string',
                  name: 'string',
                },
              ],
            },
          ],
        },

        {
          type: 'object',
          name: 'object1',
          fields: [
            {
              type: 'object',
              name: 'object2',
              fields: [
                {
                  type: 'array',
                  name: 'pte',
                  of: [{type: 'block'}],
                },

                {
                  type: 'array',
                  name: 'primitiveArray',
                  of: [{type: 'string'}],
                },

                {
                  type: 'array',
                  name: 'objectArray',
                  of: [
                    {
                      type: 'object',
                      name: 'myObject',
                      fields: [
                        {
                          type: 'string',
                          name: 'string',
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

describe('tree-editing: findArrayTypePaths', () => {
  test('should find array type paths in nested objects', () => {
    const rootObject = schema.get('testDocument').fields[0]

    const paths = findArrayTypePaths(rootObject.type.fields)

    expect(paths).toEqual([
      ['nestedObject1', 'nestedObject2', 'nestedArray0'],
      ['nestedObject1', 'nestedObject2', 'nestedObject3', 'nestedArray1'],
      ['nestedObject1', 'nestedObject2', 'nestedObject3', 'nestedArray2'],
    ])
  })

  test('should return an empty array if no array types are found', () => {
    const objectWithoutArrays = schema.get('testDocument').fields[1]

    const paths = findArrayTypePaths(objectWithoutArrays.type.fields)

    expect(paths).toEqual([])
  })

  test('should ignore block type arrays and primitive arrays', () => {
    const objectWithPortableText = schema.get('testDocument').fields[2]

    const paths = findArrayTypePaths(objectWithPortableText.type.fields)

    expect(paths).toEqual([['object2', 'objectArray']])
  })
})
