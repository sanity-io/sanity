import {type CrossDatasetReferenceSchemaType, defineField, defineType} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {createSchema} from '../../../schema/createSchema'
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
            defineField({name: 'descriptionTextField', type: 'text'}),
            defineField({name: 'markdownField', type: 'markdown'}),
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
        defineType({
          name: 'markdown',
          type: 'text',
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
        {path: 'descriptionTextField', weight: 1},
        {path: 'markdownField', weight: 1},
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

  it('returns a weight of 0 for hidden slug fields', () => {
    const schema = createSchema({
      name: 'default',
      types: [
        defineType({
          name: 'testType',
          type: 'document',
          preview: {select: {}},
          fields: [
            defineField({
              name: 'someSlug',
              type: 'slug',
              hidden: true,
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
        {path: 'someSlug.current', weight: 0},
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
        defineType({
          name: 'testType2',
          type: 'document',
          preview: {
            select: {
              title: 'someSlug.current',
            },
          },
          fields: [
            defineField({
              name: 'someSlug',
              type: 'slug',
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

    expect(
      deriveSearchWeightsFromType({
        schemaType: schema.get('testType2')!,
        maxDepth: 5,
      }),
    ).toEqual({
      typeName: 'testType2',
      paths: [
        {path: '_id', weight: 1},
        {path: '_type', weight: 1},
        {path: 'someSlug.current', weight: 10},
      ],
    })
  })

  it('returns special weights for fields that are selected in the preview config for cross dataset reference types', () => {
    const schema = createSchema({
      name: 'default',
      types: [
        {
          name: 'testType',
          type: 'crossDatasetReference',
          dataset: 'foo',
          to: [
            {
              type: 'book',
              preview: {
                select: {
                  title: 'title',
                  subtitle: 'some.derived',
                },
              },
            },
          ],
        },
      ],
    })
    expect(
      deriveSearchWeightsFromType({
        schemaType: (schema.get('testType') as CrossDatasetReferenceSchemaType).to[0]!,
        maxDepth: 5,
        isCrossDataset: true,
      }),
    ).toEqual({
      typeName: 'book',
      paths: [
        {path: '_id', weight: 1},
        {path: '_type', weight: 1},
        {path: 'title', weight: 10},
        {path: 'some.derived', weight: 5},
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
            defineField({
              name: 'someSlug',
              type: 'slug',
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
        {path: 'someSlug.current', weight: 7},
      ],
    })
  })

  it('works for schemas that branch out a lot', {timeout: 10000}, () => {
    // schema of 60 "components" with 10 fields each
    const range = [...Array(60).keys()]

    const componentRefs = range.map((index) => ({type: `component_${index}`}))
    const components = range.map((index) =>
      defineType({
        name: `component_${index}`,
        type: 'object',
        fields: [
          ...[...Array(10).keys()].map((fieldIndex) =>
            defineField({name: `component_${index}_field_${fieldIndex}`, type: 'string'}),
          ),
          defineField({name: `children_${index}`, type: 'array', of: [...componentRefs]}),
        ],
      }),
    )

    const schema = createSchema({
      name: 'default',
      types: [
        ...components,
        defineType({
          name: 'testType',
          type: 'document',
          fields: [
            defineField({
              name: 'components',
              type: 'array',
              of: [...componentRefs],
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
    ).toMatchObject({
      typeName: 'testType',
    })
  })
})
