import {defineArrayMember, defineField, defineType} from 'sanity'

// A test document with every field kind that matters for field marks (the gutter mark that says a field differs from the
// base document): primitive, nested object, array of primitives, array of objects with `_key`, reference, image, portable
// text. Seeded with a base and a variant that differ in each kind (seed/seed-field-marks.mts).
export const fieldMarksTest = defineType({
  name: 'fieldMarksTest',
  title: 'Field marks test',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string'}),
    defineField({name: 'subtitle', type: 'string'}),
    defineField({
      name: 'settings',
      type: 'object',
      fields: [
        defineField({name: 'theme', type: 'string'}),
        defineField({
          name: 'meta',
          type: 'object',
          fields: [defineField({name: 'owner', type: 'string'}), defineField({name: 'region', type: 'string'})],
        }),
      ],
    }),
    defineField({name: 'tags', type: 'array', of: [defineArrayMember({type: 'string'})]}),
    defineField({
      name: 'sections',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'section',
          fields: [defineField({name: 'heading', type: 'string'}), defineField({name: 'text', type: 'text', rows: 2})],
          preview: {select: {title: 'heading', subtitle: 'text'}},
        }),
      ],
    }),
    defineField({name: 'featured', type: 'reference', to: [{type: 'book'}]}),
    defineField({name: 'cover', type: 'image', options: {hotspot: true}}),
    defineField({name: 'body', type: 'array', of: [defineArrayMember({type: 'block'})]}),
  ],
  preview: {select: {title: 'title', subtitle: 'subtitle'}},
})
