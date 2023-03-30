import {defineField} from 'sanity'

/**
 * Note: Perf test schemas are immutable - instead of modifying a schema, create a new one and suffix the name with a version number.
 *
 */
export const largeDocument = {
  type: 'document',
  name: 'largeDocument',
  fields: [
    defineField({
      name: 'contentBlocks',
      title: 'Content Blocks',
      type: 'array',
      of: [
        {
          type: 'block',
        },
        {
          type: 'image',
        },
      ],
      initialValue: [],
    }),
    defineField({
      name: 'listContent',
      title: 'List Content',
      type: 'object',
      fields: [
        defineField({
          name: 'dateWritten',
          title: 'Date Written',
          type: 'date',
        }),
        defineField({
          name: 'description',
          title: 'Description',
          type: 'text',
        }),
        defineField({
          name: 'image',
          title: 'Image',
          type: 'image',
        }),
        defineField({
          name: 'title',
          title: 'Title',
          type: 'string',
        }),
      ],
    }),
    defineField({
      name: 'meta',
      title: 'Meta',
      type: 'object',
      fields: [
        defineField({
          name: 'description',
          title: 'Description',
          type: 'text',
        }),
        defineField({
          name: 'image',
          title: 'Image',
          type: 'image',
        }),
        defineField({
          name: 'title',
          title: 'Title',
          type: 'string',
        }),
      ],
    }),
    defineField({
      name: 'settings',
      title: 'Settings',
      type: 'object',
      fields: [
        defineField({
          name: 'noIndex',
          title: 'No Index',
          type: 'boolean',
        }),
      ],
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'listContent.title',
      },
    }),
    defineField({
      name: 'subdirectory',
      title: 'Subdirectory',
      type: 'string',
    }),
  ],
}
