import {UsersIcon} from '@sanity/icons/Users'
import {defineArrayMember, defineField, defineType} from 'sanity'

/**
 * A document for exercising presence by hand. Every field has the "Fake presence here" field
 * action (see `dev/test-studio/plugins/presence-debug`), which places a chosen user at the field,
 * or at the current cursor inside a Portable Text field. Plenty of fields, so some are always
 * scrolled out of view for the docking behavior.
 */
export const presenceDebug = defineType({
  type: 'document',
  name: 'presenceDebug',
  title: 'Presence debug',
  icon: UsersIcon,
  fields: [
    defineField({type: 'string', name: 'title', title: 'Title'}),
    defineField({type: 'string', name: 'subtitle', title: 'Subtitle'}),
    defineField({
      type: 'array',
      name: 'tags',
      title: 'Tags',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags'},
    }),
    defineField({
      type: 'object',
      name: 'author',
      title: 'Author',
      fields: [
        defineField({type: 'string', name: 'name', title: 'Name'}),
        defineField({type: 'text', name: 'bio', title: 'Bio'}),
        defineField({
          type: 'object',
          name: 'address',
          title: 'Address',
          fields: [
            defineField({type: 'string', name: 'street', title: 'Street'}),
            defineField({type: 'string', name: 'city', title: 'City'}),
          ],
        }),
      ],
    }),
    defineField({
      type: 'array',
      name: 'body',
      title: 'Body',
      description:
        'Place your cursor anywhere and use "Fake presence here" to put a user at that exact spot',
      of: [
        defineArrayMember({type: 'block'}),
        defineArrayMember({
          type: 'object',
          name: 'callout',
          title: 'Callout',
          fields: [
            defineField({type: 'string', name: 'heading', title: 'Heading'}),
            defineField({type: 'text', name: 'text', title: 'Text'}),
          ],
        }),
      ],
    }),
    defineField({type: 'number', name: 'rating', title: 'Rating'}),
    defineField({type: 'boolean', name: 'published', title: 'Published'}),
    defineField({
      type: 'array',
      name: 'sections',
      title: 'Sections',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'section',
          title: 'Section',
          fields: [
            defineField({type: 'string', name: 'heading', title: 'Heading'}),
            defineField({
              type: 'array',
              name: 'content',
              title: 'Content',
              of: [defineArrayMember({type: 'block'})],
            }),
          ],
          preview: {select: {title: 'heading'}},
        }),
      ],
    }),
    ...Array.from({length: 8}, (_, i) =>
      defineField({type: 'string', name: `extra${i + 1}`, title: `Extra field ${i + 1}`}),
    ),
    defineField({
      type: 'array',
      name: 'footer',
      title: 'Footer',
      of: [defineArrayMember({type: 'block'})],
    }),
  ],
  preview: {
    select: {title: 'title'},
    prepare: ({title}) => ({title: title || 'Presence debug'}),
  },
})
