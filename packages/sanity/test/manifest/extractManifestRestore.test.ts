import {
  defineArrayMember,
  defineField,
  defineType,
  type ObjectSchemaType,
  type SchemaType,
} from '@sanity/types'
import pick from 'lodash/pick'
import {describe, expect, test} from 'vitest'

import {extractManifestSchemaTypes} from '../../src/_internal/manifest/extractWorkspaceManifest'
import {createSchema} from '../../src/core/schema/createSchema'

describe('Extract studio manifest', () => {
  test('extracted schema types should be mappable to a createSchema compatible version', () => {
    const documentType = 'basic'
    const sourceSchema = createSchema({
      name: 'test',
      types: [
        defineType({
          name: documentType,
          type: 'document',
          fields: [
            defineField({name: 'string', type: 'string'}),
            defineField({name: 'text', type: 'text'}),
            defineField({name: 'number', type: 'number'}),
            defineField({name: 'boolean', type: 'boolean'}),
            defineField({name: 'date', type: 'date'}),
            defineField({name: 'datetime', type: 'datetime'}),
            defineField({name: 'geopoint', type: 'geopoint'}),
            defineField({name: 'image', type: 'image'}),
            defineField({name: 'file', type: 'file'}),
            defineField({name: 'slug', type: 'slug'}),
            defineField({name: 'url', type: 'url'}),
            defineField({name: 'object', type: documentType}),
            defineField({
              type: 'object',
              name: 'nestedObject',
              fields: [{name: 'nestedString', type: 'string'}],
            }),
            defineField({
              type: 'image',
              name: 'customImage',
              fields: [{name: 'title', type: 'string'}],
            }),
            defineField({
              type: 'file',
              name: 'customFile',
              fields: [{name: 'title', type: 'string'}],
              options: {storeOriginalFilename: true},
            }),
            defineField({
              name: 'typeAliasArray',
              type: 'array',
              of: [{type: documentType}],
            }),
            defineField({
              name: 'stringArray',
              type: 'array',
              of: [{type: 'string'}],
            }),
            defineField({
              name: 'numberArray',
              type: 'array',
              of: [{type: 'number'}],
            }),
            defineField({
              name: 'booleanArray',
              type: 'array',
              of: [{type: 'boolean'}],
            }),
            defineField({
              name: 'objectArray',
              type: 'array',
              of: [
                defineArrayMember({
                  type: 'object',
                  fields: [defineField({name: 'itemTitle', type: 'string'})],
                }),
              ],
            }),
            defineField({
              name: 'reference',
              type: 'reference',
              to: [{type: documentType}],
            }),
            defineField({
              name: 'crossDatasetReference',
              type: 'crossDatasetReference',
              dataset: 'production',
              to: [
                {
                  type: documentType,
                  preview: {select: {title: 'title'}},
                },
              ],
            }),
            defineField({
              name: 'refArray',
              type: 'array',
              of: [
                defineArrayMember({
                  name: 'reference',
                  type: 'reference',
                  to: [{type: documentType}],
                }),
              ],
            }),
            defineField({
              name: 'pt',
              type: 'array',
              of: [
                defineArrayMember({
                  name: 'block',
                  type: 'block',
                  of: [
                    defineField({
                      name: 'inlineBlock',
                      type: 'object',
                      fields: [
                        defineField({
                          name: 'value',
                          type: 'string',
                        }),
                      ],
                    }),
                  ],
                  marks: {
                    annotations: [
                      defineField({
                        name: 'annotation',
                        type: 'object',
                        fields: [
                          defineField({
                            name: 'value',
                            type: 'string',
                          }),
                        ],
                      }),
                    ],
                    decorators: [{title: 'Custom mark', value: 'custom'}],
                  },
                  lists: [{value: 'bullet', title: 'Bullet list'}],
                  styles: [{value: 'customStyle', title: 'Custom style'}],
                }),
              ],
            }),
          ],
        }),
      ],
    })

    const extracted = extractManifestSchemaTypes(sourceSchema)

    const restoredSchema = createSchema({
      name: 'test',
      types: extracted,
    })

    expect(restoredSchema._validation).toEqual([])
    expect(restoredSchema.getTypeNames().sort()).toEqual(sourceSchema.getTypeNames().sort())

    const restoredDocument = restoredSchema.get(documentType) as ObjectSchemaType
    const sourceDocument = sourceSchema.get(documentType) as ObjectSchemaType

    // this is not an exhaustive test (requires additional mapping to make validation, readOnly ect schema def compliant);
    // it just asserts that a basic schema can be restored without crashing
    expect(typeForComparison(restoredDocument)).toEqual(typeForComparison(sourceDocument))
  })
})

function typeForComparison(_type: SchemaType, depth = 0): unknown {
  const type = pick(_type, 'jsonType', 'name', 'title', 'fields', 'of', 'to')

  if (depth > 10) {
    return undefined
  }

  if ('to' in type) {
    return {
      ...type,
      to: (type.to as SchemaType[]).map((item) => ({
        type: item.name,
      })),
    }
  }

  if (type.jsonType === 'object' && type.fields) {
    return {
      ...type,
      fields: type.fields.map((field) => ({
        ...field,
        type: typeForComparison(field.type, depth + 1),
      })),
    }
  }
  if (type.jsonType === 'array' && 'of' in type) {
    return {
      ...type,
      of: (type.of as SchemaType[]).map((item) => typeForComparison(item, depth + 1)),
    }
  }

  return type
}
