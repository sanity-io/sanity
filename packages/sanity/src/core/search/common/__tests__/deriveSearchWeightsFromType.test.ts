import {describe, expect, it} from '@jest/globals'
import {defineField, defineType} from '@sanity/types'

import {createSchema} from '../../../schema'
import {deriveSearchWeightsFromType} from '../deriveSearchWeightsFromType'

describe('deriveSearchWeightsFromType', () => {
  it('finds all the strings and PT fields within a document type', () => {
    const schema = createSchema({
      name: 'default',
      types: [
        defineType({
          name: 'namedObject',
          type: 'object',
          fields: [
            defineField({name: 'nestedStringField', type: 'string'}),
            defineField({name: 'nestedPtField', type: 'array', of: [{type: 'block'}]}),
          ],
        }),
        defineType({
          name: 'testType',
          type: 'document',
          preview: {select: {}},
          fields: [
            defineField({name: 'simpleStringField', type: 'string'}),
            defineField({
              name: 'simplePtField',
              type: 'array',
              of: [{type: 'block'}],
            }),
            defineField({
              name: 'simpleObject',
              type: 'object',
              fields: [
                defineField({name: 'nestedStringField', type: 'string'}),
                defineField({name: 'nestedPtField', type: 'array', of: [{type: 'block'}]}),
              ],
            }),
            defineField({
              name: 'hasNestedObject',
              type: 'object',
              fields: [
                defineField({
                  type: 'object',
                  name: 'nestedObject',
                  fields: [
                    defineField({name: 'nestedNestedStringField', type: 'string'}),
                    defineField({
                      name: 'nestedNestedPtField',
                      type: 'array',
                      of: [{type: 'block'}],
                    }),
                  ],
                }),
              ],
            }),
            defineField({
              name: 'namedObjectField',
              type: 'namedObject',
            }),
            defineField({
              name: 'simpleArrayOfStrings',
              type: 'array',
              of: [{type: 'string'}],
            }),
            defineField({
              name: 'arrayOfObjects',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    {name: 'stringInArray', type: 'string'},
                    {name: 'ptInArray', type: 'array', of: [{type: 'block'}]},
                  ],
                },
              ],
            }),
            defineField({
              name: 'arrayOfNamedType',
              type: 'array',
              of: [{type: 'namedObject'}],
            }),
          ],
        }),
      ],
    })

    expect(
      deriveSearchWeightsFromType({
        schemaType: schema.get('testType')!,
        maxDepth: 5,
      }),
    ).toEqual({
      typeName: 'testType',
      paths: [
        {path: '_id', weight: 1},
        {path: '_type', weight: 1},
        {path: 'simpleStringField', weight: 1},
        {path: 'simplePtField', weight: 1, mapWith: 'pt::text'},
        {path: 'simpleObject.nestedStringField', weight: 1},
        {path: 'simpleObject.nestedPtField', weight: 1, mapWith: 'pt::text'},
        {path: 'hasNestedObject.nestedObject.nestedNestedStringField', weight: 1},
        {path: 'hasNestedObject.nestedObject.nestedNestedPtField', weight: 1, mapWith: 'pt::text'},
        {path: 'namedObjectField.nestedStringField', weight: 1},
        {path: 'namedObjectField.nestedPtField', weight: 1, mapWith: 'pt::text'},
        {path: 'simpleArrayOfStrings[]', weight: 1},
        {path: 'arrayOfObjects[].stringInArray', weight: 1},
        {path: 'arrayOfObjects[].ptInArray', weight: 1, mapWith: 'pt::text'},
        {path: 'arrayOfNamedType[].nestedStringField', weight: 1},
        {path: 'arrayOfNamedType[].nestedPtField', weight: 1, mapWith: 'pt::text'},
      ],
    })
  })

  it('returns a weight of 0 for hidden string and PT fields', () => {
    const schema = createSchema({
      name: 'default',
      types: [
        defineType({
          name: 'testType',
          type: 'document',
          preview: {select: {}},
          fields: [
            defineField({name: 'simpleStringField', type: 'string', hidden: true}),
            defineField({
              name: 'simplePtField',
              type: 'array',
              of: [{type: 'block'}],
              hidden: true,
            }),
            defineField({
              name: 'simpleObject',
              type: 'object',
              fields: [
                defineField({name: 'nestedStringField', type: 'string'}),
                defineField({name: 'nestedPtField', type: 'array', of: [{type: 'block'}]}),
              ],
            }),
          ],
        }),
      ],
    })

    expect(
      deriveSearchWeightsFromType({
        schemaType: schema.get('testType')!,
        maxDepth: 5,
      }),
    ).toEqual({
      typeName: 'testType',
      paths: [
        {path: '_id', weight: 1},
        {path: '_type', weight: 1},
        {path: 'simpleObject.nestedStringField', weight: 1},
        {path: 'simpleObject.nestedPtField', weight: 1, mapWith: 'pt::text'},
        {path: 'simpleStringField', weight: 0},
        {path: 'simplePtField', weight: 0, mapWith: 'pt::text'},
      ],
    })
  })

  it('respects `maxDepth`', () => {
    const schema = createSchema({
      name: 'default',
      types: [
        defineType({
          name: 'testType',
          type: 'document',
          preview: {select: {}},
          fields: [
            defineField({name: 'simpleStringField', type: 'string'}),
            defineField({
              name: 'simpleObject',
              type: 'object',
              fields: [
                defineField({name: 'nestedString', type: 'string'}),
                defineField({
                  name: 'nestedObject',
                  type: 'object',
                  fields: [
                    defineField({
                      name: 'nestedNestedStringField',
                      type: 'string',
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    })

    expect(
      deriveSearchWeightsFromType({
        schemaType: schema.get('testType')!,
        maxDepth: 2,
      }),
    ).toEqual({
      typeName: 'testType',
      paths: [
        {path: '_id', weight: 1},
        {path: '_type', weight: 1},
        {path: 'simpleStringField', weight: 1},
        {path: 'simpleObject.nestedString', weight: 1},
      ],
    })
  })

  it('returns special weights for fields that are selected in the preview config', () => {
    const schema = createSchema({
      name: 'default',
      types: [
        defineType({
          name: 'testType',
          type: 'document',
          preview: {
            select: {
              title: 'simpleObject.titleField',
              subtitle: 'arrayOfObjects.0.subtitleField',
              description: 'descriptionField',
            },
          },
          fields: [
            defineField({
              name: 'simpleObject',
              type: 'object',
              fields: [defineField({name: 'titleField', type: 'string'})],
            }),
            defineField({
              name: 'arrayOfObjects',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [defineField({name: 'subtitleField', type: 'string'})],
                },
              ],
            }),
            defineField({
              name: 'descriptionField',
              type: 'array',
              of: [{type: 'block'}],
            }),
          ],
        }),
      ],
    })

    expect(
      deriveSearchWeightsFromType({
        schemaType: schema.get('testType')!,
        maxDepth: 5,
      }),
    ).toEqual({
      typeName: 'testType',
      paths: [
        {path: '_id', weight: 1},
        {path: '_type', weight: 1},
        {path: 'simpleObject.titleField', weight: 10},
        {path: 'arrayOfObjects[].subtitleField', weight: 5},
        {path: 'descriptionField', weight: 1.5, mapWith: 'pt::text'},
      ],
    })
  })

  it('always returns the user set weights, ignoring all other derived fields', () => {
    const schema = createSchema({
      name: 'default',
      types: [
        defineType({
          name: 'testType',
          type: 'document',
          preview: {
            select: {
              title: 'titleField',
              subtitle: 'subtitleField',
              description: 'descriptionField',
            },
          },
          fields: [
            defineField({name: 'titleField', type: 'string', options: {search: {weight: 7}}}),
            defineField({name: 'subtitleField', type: 'string', options: {search: {weight: 7}}}),
            defineField({name: 'descriptionField', type: 'string', options: {search: {weight: 7}}}),
            defineField({
              name: 'hiddenField',
              type: 'string',
              hidden: true,
              options: {search: {weight: 7}},
            }),
            defineField({
              name: 'normalStringField',
              type: 'string',
              options: {search: {weight: 7}},
            }),
          ],
        }),
      ],
    })

    expect(
      deriveSearchWeightsFromType({
        schemaType: schema.get('testType')!,
        maxDepth: 5,
      }),
    ).toEqual({
      typeName: 'testType',
      paths: [
        {path: '_id', weight: 1},
        {path: '_type', weight: 1},
        {path: 'hiddenField', weight: 7},
        {path: 'titleField', weight: 7},
        {path: 'subtitleField', weight: 7},
        {path: 'descriptionField', weight: 7},
        {path: 'normalStringField', weight: 7},
      ],
    })
  })
})
