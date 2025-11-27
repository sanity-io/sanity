import {DescriptorConverter} from '@sanity/schema/_internal'
import {defineArrayMember, defineField, defineType, type Schema} from '@sanity/types'
import {createSchema} from 'sanity'
import {describe, test} from 'vitest'

import {expectManifestSchemaConversion} from './utils'

const DESCRIPTOR_CONVERTER = new DescriptorConverter()

async function validate(schema: Schema) {
  await expectManifestSchemaConversion(schema, await DESCRIPTOR_CONVERTER.get(schema))
}

// The schemas are taken from packages/@sanity/schema/test/extractSchema/extractSchema.test.ts
describe('ManifestSchemaTypes[] converts to Schema', () => {
  test('field with type', async () => {
    const schema = createSchema({
      name: 'test',
      types: [
        defineType({
          name: 'foo',
          type: 'object',
          fields: [
            {
              name: 'key',
              type: 'string',
            },
          ],
        }),
        defineType({
          name: 'bar',
          type: 'object',
          fields: [
            {
              name: 'foo',
              type: 'foo',
              options: [
                {
                  name: 'foo',
                  type: 'foo',
                  title: 'This one is being overriden',
                },
              ],
            },
          ],
        }),
      ],
    })

    await validate(schema)
  })

  test('can convert a simple schema', async () => {
    const schema = createSchema({
      name: 'test',
      types: [
        defineType({
          title: 'Valid document',
          name: 'validDocument',
          type: 'document',
          fields: [
            {
              title: 'Title',
              name: 'title',
              type: 'string',
            },
            {
              title: 'List',
              name: 'list',
              type: 'string',
              options: {
                list: ['a', 'b', 'c'],
              },
              validation: (Rule) => Rule.required(),
            },
            {
              title: 'Number',
              name: 'number',
              type: 'number',
            },
            {
              title: 'some other object',
              name: 'someInlinedObject',
              type: 'obj',
            },
            {
              title: 'Manuscript',
              name: 'manuscript',
              type: 'manuscript',
            },
            {
              title: 'Some text',
              name: 'someTextType',
              type: 'someTextType',
            },
            {
              title: 'customStringType',
              name: 'customStringType',
              type: 'customStringType',
            },
            {
              title: 'Blocks',
              name: 'blocks',
              type: 'array',
              of: [{type: 'block'}],
            },
            {
              type: 'reference',
              name: 'other',
              to: {
                type: 'otherValidDocument',
              },
            },
            {
              type: 'reference',
              name: 'others',
              to: [
                {
                  type: 'otherValidDocument',
                },
              ],
            },
          ],
        }),
        {
          title: 'Author',
          name: 'author',
          type: 'document',
          fields: [
            {
              title: 'Name',
              name: 'name',
              type: 'string',
            },
            {
              title: 'Profile picture',
              name: 'profilePicture',
              type: 'image',
              options: {
                hotspot: true,
              },
              fields: [
                {
                  name: 'caption',
                  type: 'string',
                  title: 'Caption',
                },
                {
                  name: 'attribution',
                  type: 'string',
                  title: 'Attribution',
                },
              ],
            },
          ],
        },
        {
          title: 'Book',
          name: 'book',
          type: 'document',
          fields: [
            {
              title: 'Name',
              name: 'name',
              type: 'string',
            },
          ],
        },
        // Block,
        {
          title: 'Other valid document',
          name: 'otherValidDocument',
          type: 'document',
          fields: [
            {
              title: 'Title',
              name: 'title',
              type: 'string',
            },
          ],
        },
        {
          type: 'object',
          name: 'obj',
          fields: [
            {
              title: 'Field #1',
              name: 'field1',
              type: 'string',
            },
            {
              title: 'Field #2',
              name: 'field2',
              type: 'number',
            },
          ],
        },
        defineType({
          name: 'customStringType',
          title: 'My custom string type',
          type: 'string',
        }),
        {
          type: 'object',
          name: 'code',
          fields: [
            {
              title: 'The Code!',
              name: 'thecode',
              type: 'string',
            },
          ],
        },
        {
          title: 'Manuscript',
          name: 'manuscript',
          type: 'file',
          fields: [
            {
              name: 'description',
              type: 'string',
              title: 'Description',
            },
            {
              name: 'author',
              type: 'reference',
              title: 'Author',
              to: {type: 'author'},
            },
          ],
        },
        defineType({
          name: 'someTextType',
          type: 'text',
        }),
      ],
    })

    await validate(schema)
  })

  test('all fields are marked as optional without "enforceRequiredFields"', async () => {
    const schema = createSchema({
      name: 'test',
      types: [
        {
          title: 'Book',
          name: 'book',
          type: 'document',
          fields: [
            {
              title: 'Title',
              name: 'title',
              type: 'string',
            },
            defineField({
              title: 'Subtitle',
              name: 'subtitle',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            {
              title: 'Another Title',
              name: 'anotherTitle',
              type: 'string',
              validation: {_required: 'required'},
            },
          ],
        },
      ],
    })

    await validate(schema)
  })

  // Skipping as extractManifestSchemaTypes does not allow `enforceRequiredFields`
  test('optional is set when "enforceRequiredFields"', {skip: true}, async () => {
    const schema = createSchema({
      name: 'test',
      types: [
        {
          title: 'Book',
          name: 'book',
          type: 'document',
          fields: [
            {
              title: 'Title',
              name: 'title',
              type: 'string',
            },
            defineField({
              title: 'Subtitle',
              name: 'subtitle',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            {
              title: 'Another Title',
              name: 'anotherTitle',
              type: 'string',
              validation: {_required: 'required'},
            },
            {
              title: 'Optional Title',
              name: 'optionalTitle',
              type: 'string',
              validation: {_required: 'optional'},
            },
          ],
        },
      ],
    })

    await validate(schema /*, {enforceRequiredFields: true} */)
  })

  test('can extract inline documents', async () => {
    const schema = createSchema({
      name: 'test',
      types: [
        defineType({
          title: 'Valid document',
          name: 'validDocument',
          type: 'document',
          fields: [
            {
              title: 'inline author',
              name: 'inlineAuthor',
              type: 'author',
            },
            {
              title: 'inline author',
              name: 'inlineAuthors',
              type: 'array',
              of: [{type: 'author'}],
            },
            {
              title: 'reference author',
              name: 'referenceAuthor',
              type: 'reference',
              to: [{type: 'author'}],
            },
            {
              title: 'references author',
              name: 'referenceAuthors',
              type: 'array',
              of: [{type: 'reference', to: [{type: 'author'}]}],
            },
          ],
        }),
        {
          title: 'Author',
          name: 'author',
          type: 'document',
          fields: [
            {
              title: 'Name',
              name: 'name',
              type: 'string',
            },
          ],
        },
      ],
    })

    await validate(schema)
  })

  test('will ignore global document reference types at the moment', async () => {
    const schema = createSchema({
      name: 'test',
      types: [
        defineType({
          title: 'Valid document',
          name: 'validDocument',
          type: 'document',
          fields: [
            {
              type: 'globalDocumentSubtype',
              name: 'author',
            },
            {
              type: 'book',
              name: 'book',
            },
          ],
        }),
        {
          type: 'globalDocumentReference',
          name: 'globalDocumentSubtype',
          title: 'Subtype of global document references',
          resourceType: 'dataset',
          resourceId: 'exx11uqh.blog',
          to: [
            {
              type: 'book',
              preview: {
                select: {
                  title: 'title',
                  media: 'coverImage',
                },
                prepare(val: any) {
                  return {
                    title: val.title,
                    media: val.coverImage,
                  }
                },
              },
            },
          ],
        },
        {
          type: 'object',
          title: 'Book',
          name: 'book',
          fields: [
            {
              type: 'string',
              name: 'title',
            },
          ],
        },
      ],
    })

    await validate(schema)
  })

  test('extracted schema should only include user defined types (and no built-in types)', async () => {
    const documentType = 'basic'
    const schema = createSchema({
      name: 'test',
      types: [
        defineType({
          name: documentType,
          type: 'document',
          fields: [defineField({name: 'title', type: 'string'})],
        }),
      ],
    })

    await validate(schema)
  })

  test('indicate conditional for function values on hidden and readOnly fields', async () => {
    const documentType = 'basic'

    const schema = createSchema({
      name: 'test',
      types: [
        defineType({
          name: documentType,
          type: 'document',
          readOnly: true,
          hidden: false,
          fields: [
            defineField({
              name: 'string',
              type: 'string',
              hidden: () => true,
              readOnly: () => false,
            }),
          ],
        }),
      ],
    })

    await validate(schema)
  })

  test('should omit known non-serializable schema props ', async () => {
    const documentType = 'remove-props'

    const schema = createSchema({
      name: 'test',
      types: [
        defineType({
          //include
          name: documentType,
          type: 'document',
          title: 'My document',
          description: 'Stuff',
          deprecated: {
            reason: 'old',
          },
          options: {
            // @ts-expect-error - this is a test
            custom: 'value',
          },
          initialValue: {title: 'Default'},
          liveEdit: true,

          //omit
          icon: () => 'remove-icon',
          groups: [{name: 'groups-are-removed'}],
          // eslint-disable-next-line camelcase
          __experimental_omnisearch_visibility: true,
          // eslint-disable-next-line camelcase
          __experimental_search: [
            {
              path: 'title',
              weight: 100,
            },
          ],
          // eslint-disable-next-line camelcase
          __experimental_formPreviewTitle: true,
          components: {
            field: () => 'remove-components',
          },
          // orderings behaviour is validated in schema.test.ts
          // orderings: [
          //   {name: 'remove-orderings', title: '', by: [{field: 'title', direction: 'desc'}]},
          // ],
          fields: [
            defineField({
              name: 'string',
              type: 'string',
              group: 'groups-are-removed',
            }),
          ],
          preview: {
            select: {title: 'remove-preview'},
          },
        }),
      ],
    })

    await validate(schema)
  })

  test('schema should include most userland properties', async () => {
    const documentType = 'basic'

    const recursiveObject: any = {
      repeat: 'string',
    }
    recursiveObject.recurse = recursiveObject

    const customization: any = {
      recursiveObject, // this one will be cut off at max-depth
      serializableProp: 'dummy',
      nonSerializableProp: () => {},
      options: {
        serializableOption: true,
        nonSerializableOption: () => {},
        nested: {
          serializableOption: 1,
          nonSerializableOption: () => {},
        },
      },
    }

    const schema = createSchema({
      name: 'test',
      types: [
        defineType({
          name: documentType,
          type: 'document',
          fields: [
            defineField({
              title: 'Nested',
              name: 'nested',
              type: 'object',
              fields: [
                defineField({
                  title: 'Nested inline string',
                  name: 'nestedString',
                  type: 'string',
                  ...customization,
                }),
              ],
              ...customization,
            }),
          ],
          ...customization,
        }),
      ],
    })

    await validate(schema)
  })

  test('should serialize fieldset config', async () => {
    const documentType = 'fieldsets'

    const schema = createSchema({
      name: 'test',
      types: [
        defineType({
          name: documentType,
          type: 'document',
          fields: [
            defineField({
              name: 'string',
              type: 'string',
            }),
          ],
          preview: {
            select: {title: 'title'},
            prepare: () => ({
              title: 'remove-prepare',
            }),
          },
        }),
      ],
    })

    await validate(schema)
  })

  test('serialize fieldless types', async () => {
    const documentType = 'fieldless-types'
    const schema = createSchema({
      name: 'test',
      types: [
        defineType({
          title: 'Some document',
          name: documentType,
          type: 'document',
          fields: [
            defineField({title: 'String field', name: 'string', type: 'string'}),
            defineField({title: 'Text field', name: 'text', type: 'text'}),
            defineField({title: 'Number field', name: 'number', type: 'number'}),
            defineField({title: 'Boolean field', name: 'boolean', type: 'boolean'}),
            defineField({title: 'Date field', name: 'date', type: 'date'}),
            defineField({title: 'Datetime field', name: 'datetime', type: 'datetime'}),
            defineField({title: 'Geopoint field', name: 'geopoint', type: 'geopoint'}),
            defineField({title: 'Basic image field', name: 'image', type: 'image'}),
            defineField({title: 'Basic file field', name: 'file', type: 'file'}),
            defineField({title: 'Slug field', name: 'slug', type: 'slug'}),
            defineField({title: 'URL field', name: 'url', type: 'url'}),
            defineField({
              title: 'Reference field',
              name: 'reference',
              type: 'reference',
              to: {type: 'string'},
            }),
            defineField({title: 'Email field', name: 'email', type: 'email'}),
          ],
        }),
      ],
    })

    await validate(schema)
  })

  test('serialize types with fields', async () => {
    const documentType = 'field-types'
    const schema = createSchema({
      name: 'test',
      types: [
        defineType({
          fields: [
            {
              name: 'existingType',
              type: documentType,
            },
            {
              fields: [
                {
                  name: 'nestedString',
                  title: 'Nested inline string',
                  type: 'string',
                },
                {
                  fields: [
                    {
                      name: 'inner',
                      title: 'Inner',
                      type: 'number',
                    },
                  ],
                  name: 'nestedTwice',
                  title: 'Child object',
                  type: 'object',
                },
              ],
              name: 'nested',
              title: 'Nested',
              type: 'object',
            },
            {
              fields: [
                {
                  name: 'title',
                  title: 'Image title',
                  type: 'string',
                },
              ],
              name: 'image',
              type: 'image',
            },
            {
              fields: [
                {
                  name: 'title',
                  title: 'File title',
                  type: 'string',
                },
              ],
              name: 'file',
              type: 'file',
            },
          ],
          name: documentType,
          type: 'document',
        }),
      ],
    })

    await validate(schema)
  })

  test('serialize array-like fields (portable text tested separately)', async () => {
    const documentType = 'all-types'
    const schema = createSchema({
      name: 'test',
      types: [
        defineType({
          title: 'Basic doc',
          name: documentType,
          type: 'document',
          fields: [
            defineField({
              title: 'String array',
              name: 'stringArray',
              type: 'array',
              of: [{type: 'string'}],
            }),
            defineField({
              title: 'Number array',
              name: 'numberArray',
              type: 'array',
              of: [{type: 'number'}],
            }),
            defineField({
              title: 'Boolean array',
              name: 'booleanArray',
              type: 'array',
              of: [{type: 'boolean'}],
            }),
            defineField({
              name: 'objectArray',
              type: 'array',
              of: [
                defineArrayMember({
                  title: 'Anonymous object item',
                  type: 'object',
                  fields: [
                    defineField({
                      name: 'itemTitle',
                      type: 'string',
                    }),
                  ],
                }),
                defineArrayMember({
                  type: 'object',
                  title: 'Inline named object item',
                  name: 'item',
                  fields: [
                    defineField({
                      name: 'otherTitle',
                      type: 'string',
                    }),
                  ],
                }),
                defineArrayMember({
                  title: 'Existing type object item',
                  type: documentType,
                }),
              ],
            }),
          ],
        }),
      ],
    })

    await validate(schema)
  })

  test('serialize array with type reference and overridden typename', async () => {
    const arrayType = 'someArray'
    const objectBaseType = 'someObject'
    const schema = createSchema({
      name: 'test',
      types: [
        defineType({
          name: objectBaseType,
          type: 'object',
          fields: [
            defineField({
              name: 'title',
              type: 'string',
            }),
          ],
        }),
        defineType({
          name: arrayType,
          type: 'array',
          of: [{type: objectBaseType, name: 'override'}],
        }),
      ],
    })

    await validate(schema)
  })

  test('serialize schema with indirectly recursive structure', async () => {
    const arrayType = 'someArray'
    const objectBaseType = 'someObject'
    const otherObjectType = 'other'
    const schema = createSchema({
      name: 'test',
      types: [
        defineType({
          name: objectBaseType,
          type: 'object',
          fields: [
            defineField({
              name: 'recurse',
              type: otherObjectType,
            }),
          ],
        }),
        defineType({
          name: otherObjectType,
          type: 'object',
          fields: [
            defineField({
              name: 'recurse2',
              type: arrayType,
            }),
          ],
        }),
        defineType({
          name: arrayType,
          type: 'array',
          of: [{type: objectBaseType}],
        }),
      ],
    })

    await validate(schema)
  })

  test('serialize portable text field', async () => {
    const documentType = 'pt'
    const schema = createSchema({
      name: 'test',
      types: [
        defineType({
          name: documentType,
          type: 'document',
          fields: [
            defineField({
              title: 'Portable text',
              name: 'pt',
              type: 'array',
              of: [
                defineArrayMember({
                  title: 'Block Title',
                  name: 'block',
                  type: 'block',
                  of: [
                    defineField({
                      title: 'Inline block',
                      name: 'inlineBlock',
                      type: 'object',
                      fields: [
                        defineField({
                          title: 'Inline value',
                          name: 'value',
                          type: 'string',
                        }),
                      ],
                    }),
                  ],
                  marks: {
                    annotations: [
                      defineField({
                        title: 'Annotation',
                        name: 'annotation',
                        type: 'object',
                        fields: [
                          defineField({
                            title: 'Annotation value',
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

    await validate(schema)
  })

  test('serialize fields with references', async () => {
    const documentType = 'ref-types'
    const schema = createSchema({
      name: 'test',
      types: [
        defineType({
          name: documentType,
          type: 'document',
          fields: [
            defineField({
              title: 'Reference to',
              name: 'reference',
              type: 'reference',
              to: [{type: documentType}],
            }),
            defineField({
              title: 'Cross dataset ref',
              name: 'crossDatasetReference',
              type: 'crossDatasetReference',
              dataset: 'production',
              studioUrl: () => 'cannot serialize studioUrl function',
              to: [
                {
                  type: documentType,
                  preview: {
                    select: {title: 'title'},
                    prepare: () => ({
                      title: 'cannot serialize prepare function',
                    }),
                  },
                },
              ],
            }),
            defineField({
              type: 'globalDocumentReference',
              name: 'globalRef',
              to: [
                {
                  type: documentType,
                  preview: {
                    select: {title: 'title'},
                  },
                },
              ],
              resourceId: 'a.b',
              resourceType: 'dataset',
              weak: true,
            }),
            defineField({
              title: 'Reference array',
              name: 'refArray',
              type: 'array',
              of: [
                defineArrayMember({
                  title: 'Reference to',
                  name: 'reference',
                  type: 'reference',
                  to: [{type: documentType}],
                }),
              ],
            }),
          ],
        }),
      ],
    })

    await validate(schema)
  })

  test('fieldsets and fieldset on fields is serialized', async () => {
    const documentType = 'basic'
    const schema = createSchema({
      name: 'test',
      types: [
        defineType({
          name: documentType,
          type: 'document',
          fieldsets: [
            {
              name: 'test',
              title: 'Test fieldset',
              hidden: false,
              readOnly: true,
              options: {
                collapsed: true,
              },
              description: 'my fieldset',
            },
            {
              name: 'conditional',
              hidden: () => true,
              readOnly: () => true,
            },
          ],
          fields: [
            defineField({name: 'title', type: 'string', fieldset: 'test'}),
            defineField({name: 'other', type: 'string', fieldset: 'conditional'}),
          ],
        }),
      ],
    })

    await validate(schema)
  })

  test('do not serialize default titles (default titles added by Schema.compile based on type/field name)', async () => {
    const documentType = 'basic-document'
    const schema = createSchema({
      name: 'test',
      types: [
        defineType({
          name: documentType,
          type: 'document',
          fieldsets: [
            {name: 'someFieldset'},
            {
              name: 'conditional',
              hidden: () => true,
              readOnly: () => true,
            },
          ],
          fields: [
            defineField({name: 'title', type: 'string'}),
            defineField({name: 'someField', type: 'array', of: [{type: 'string'}]}),
            defineField({name: 'customTitleField', type: 'string', title: 'Custom'}),
          ],
        }),
      ],
    })

    await validate(schema)
  })

  test('should use the inline type, not the global type for the array.of name-conflicting inline array object items', async () => {
    const documentType = 'basic-document'
    const schema = createSchema({
      name: 'test',
      types: [
        defineType({
          type: 'object',
          name: 'reusedObjectName', // this is the same as the item in conflictingInlineObjectNameArray below, but it has different fields
          fields: [{name: 'number', type: 'number'}],
        }),
        defineType({
          name: documentType,
          type: 'document',
          fields: [
            defineField({
              name: 'conflictingInlineObjectNameArray',
              type: 'array',
              of: [
                defineArrayMember({
                  type: 'object',
                  // this is the type name as the object type above, but it is a different type, since this is an inline array item object def
                  name: 'reusedObjectName',
                  fields: [{name: 'string', type: 'string'}],
                }),
              ],
            }),
          ],
        }),
      ],
    })

    await validate(schema)
  })

  // FIXME: This test will fail because the block type title is set to the default title.
  // When this is serialized, the title will not be set in the _internal_ownProps and thus
  // not be serialized into the descriptor.
  test.fails('Defining array type title same as default title should fail', async () => {
    const documentType = 'pt'
    const schema = createSchema({
      name: 'test',
      types: [
        defineType({
          name: documentType,
          type: 'document',
          fields: [
            defineField({
              title: 'Portable text',
              name: 'pt',
              type: 'array',
              of: [
                defineArrayMember({
                  title: 'Block',
                  name: 'block',
                  type: 'block',
                }),
              ],
            }),
          ],
        }),
      ],
    })

    await validate(schema)
  })
})
