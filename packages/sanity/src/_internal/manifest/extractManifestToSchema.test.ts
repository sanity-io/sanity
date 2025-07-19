import {defineField, defineType, Schema} from '@sanity/types'
import {describe, expect, test} from 'vitest'

import {extractSchema} from '@sanity/schema/_internal'
import {extractManifestSchemaTypes} from './extractWorkspaceManifest'
import {createSchema} from 'sanity'

function assertExtractManifestSchema(schema: Schema) {
  // Extract the manifest schema types
  const schemaTypes = extractManifestSchemaTypes(schema)

  // Serialize to simulate transmitting the schemaTypes
  const data = JSON.parse(JSON.stringify(schemaTypes))

  // Convert the raw json back into a Schema
  const converted = createSchema({name: '', types: data})

  expect(extractSchema(converted)).toStrictEqual(extractSchema(schema))
}

// The schemas are taken from packages/@sanity/schema/test/extractSchema/extractSchema.test.ts
describe('ManifestSchemaTypes[] converts to Schema', () => {
  test('can convert a simple schema', () => {
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

    assertExtractManifestSchema(schema)
  })

  test('all fields are marked as optional without "enforceRequiredFields"', () => {
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

    assertExtractManifestSchema(schema)
  })

  // Skipping as extractManifestSchemaTypes does not allow `enforceRequiredFields`
  test('optional is set when "enforceRequiredFields"', {skip: true}, () => {
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

    assertExtractManifestSchema(schema /*, {enforceRequiredFields: true} */)
  })

  test('can extract inline documents', () => {
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

    assertExtractManifestSchema(schema)
  })

  test('will ignore global document reference types at the moment', () => {
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

    assertExtractManifestSchema(schema)
  })
})
