// @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
import {type Config, defineField, defineType} from 'sanity'
// @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
import {structureTool} from 'sanity/structure'

// Ported from dev/efps/tests/synthetic/sanity.config.ts
export const syntheticWorkspace = {
  name: 'synthetic-bench',
  plugins: [structureTool()],
  schema: {
    types: [
      defineType({
        name: 'synthetic',
        type: 'document',
        fields: [
          defineField({name: 'title', type: 'string'}),
          defineField({name: 'arrayOfObjects', type: 'array', of: [{type: 'syntheticObject'}]}),
          defineField({name: 'syntheticObject', type: 'syntheticObject'}),
        ],
      }),
      defineType({
        name: 'syntheticObject',
        type: 'object',
        fields: [
          defineField({name: 'name', type: 'string'}),
          defineField({name: 'image', type: 'image'}),
          defineField({name: 'file', type: 'file'}),
          defineField({name: 'geopoint', type: 'geopoint'}),
          defineField({name: 'number', type: 'number'}),
          defineField({name: 'string', type: 'string'}),
          defineField({name: 'boolean', type: 'boolean'}),
          defineField({name: 'slug', type: 'slug'}),
          defineField({name: 'text', type: 'text'}),
          defineField({name: 'reference', type: 'reference', to: [{type: 'synthetic'}]}),
          defineField({name: 'date', type: 'date'}),
          defineField({name: 'datetime', type: 'datetime'}),
          defineField({name: 'nestedObject', type: 'syntheticObject'}),
          ...Array.from({length: 20}).map((_, index) =>
            defineField({name: `field${index}`, type: 'string'}),
          ),
        ],
      }),
    ],
  },
} satisfies Partial<Config>
