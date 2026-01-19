import {defineArrayMember, defineField} from '@sanity/types'

/**
 * PTE schema configuration for release descriptions.
 *
 * Supports minimal formatting:
 * - Bold (strong)
 * - Italic (em)
 * - Underline
 * - Hyperlinks (auto-detected URLs)
 *
 * No lists or headings for simplicity.
 */
export const releaseDescriptionSchema = defineField({
  name: 'releaseDescription',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [], // No heading styles
      lists: [], // No lists
      marks: {
        decorators: [
          {title: 'Strong', value: 'strong'},
          {title: 'Emphasis', value: 'em'},
          {title: 'Underline', value: 'underline'},
        ],
        annotations: [
          {
            name: 'link',
            type: 'object',
            title: 'Link',
            fields: [
              {
                name: 'href',
                type: 'url',
                title: 'URL',
              },
            ],
          },
        ],
      },
      // Inline objects for release references
      of: [
        defineField({
          type: 'object',
          name: 'releaseReference',
          title: 'Release Reference',
          fields: [
            defineField({
              name: 'releaseId',
              type: 'string',
              title: 'Release ID',
            }),
          ],
        }),
      ],
    }),
  ],
})
