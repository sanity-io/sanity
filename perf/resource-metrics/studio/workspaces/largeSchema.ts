import {type Config, defineArrayMember, defineField, defineType} from 'sanity'
import {structureTool} from 'sanity/structure'

// Generate a set of document types with varying complexity to simulate a large schema.
// Each type has nested objects and arrays to stress-test schema compilation and form rendering.
function generateDocumentTypes() {
  const types = []

  for (let i = 0; i < 25; i++) {
    types.push(
      defineType({
        name: `docType${i}`,
        title: `Document Type ${i}`,
        type: 'document',
        fields: [
          defineField({name: 'title', type: 'string'}),
          defineField({name: 'slug', type: 'slug', options: {source: 'title'}}),
          defineField({name: 'description', type: 'text'}),
          defineField({
            name: 'metadata',
            type: 'object',
            fields: [
              defineField({name: 'createdBy', type: 'string'}),
              defineField({name: 'priority', type: 'number'}),
              defineField({
                name: 'tags',
                type: 'array',
                of: [defineArrayMember({type: 'string'})],
              }),
              defineField({
                name: 'nested',
                type: 'object',
                fields: [
                  defineField({name: 'level2Field', type: 'string'}),
                  defineField({
                    name: 'deepNested',
                    type: 'object',
                    fields: [
                      defineField({name: 'level3Field', type: 'string'}),
                      defineField({name: 'level3Number', type: 'number'}),
                    ],
                  }),
                ],
              }),
            ],
          }),
          defineField({
            name: 'items',
            type: 'array',
            of: [
              defineArrayMember({
                type: 'object',
                fields: [
                  defineField({name: 'label', type: 'string'}),
                  defineField({name: 'value', type: 'number'}),
                  defineField({name: 'image', type: 'image'}),
                ],
              }),
            ],
          }),
          // Cross-references to other generated types
          ...(i > 0
            ? [
                defineField({
                  name: 'relatedDoc',
                  type: 'reference',
                  to: [{type: `docType${i - 1}`}],
                }),
              ]
            : []),
        ],
      }),
    )
  }

  return types
}

export const largeSchema = {
  name: 'large-schema',
  title: 'Large Schema',
  plugins: [structureTool()],
  schema: {
    types: generateDocumentTypes(),
  },
} satisfies Partial<Config>
