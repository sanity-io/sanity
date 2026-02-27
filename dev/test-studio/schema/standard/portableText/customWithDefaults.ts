import {HighlightIcon} from '@sanity/icons'
import {
  DEFAULT_ANNOTATIONS,
  DEFAULT_DECORATORS,
  defineArrayMember,
  defineField,
  defineType,
} from 'sanity'

/**
 * Example schema demonstrating how to extend Portable Text with custom
 * annotations and decorators while preserving the built-in defaults.
 *
 * Uses the newly exported DEFAULT_ANNOTATIONS and DEFAULT_DECORATORS from 'sanity'.
 */
export const ptCustomWithDefaultsType = defineType({
  type: 'document',
  name: 'pt_customWithDefaults',
  title: 'Custom PT with Defaults',
  description: 'Demonstrates using DEFAULT_ANNOTATIONS and DEFAULT_DECORATORS exports',
  fields: [
    defineField({
      type: 'string',
      name: 'title',
      title: 'Title',
    }),
    defineField({
      type: 'array',
      name: 'content',
      title: 'Content',
      description: 'Block content with default + custom annotations and decorators',
      of: [
        defineArrayMember({
          type: 'block',
          marks: {
            // Spread default decorators (strong, em, code, underline, strike-through)
            // and add a custom "highlight" decorator
            decorators: [
              ...DEFAULT_DECORATORS,
              {
                title: 'Highlight',
                value: 'highlight',
                icon: HighlightIcon,
              },
            ],
            // Spread default annotations (link) and add a custom "internalLink" annotation
            annotations: [
              ...DEFAULT_ANNOTATIONS,
              defineField({
                type: 'object',
                name: 'internalLink',
                title: 'Internal Link',
                fields: [
                  defineField({
                    type: 'reference',
                    name: 'reference',
                    title: 'Reference',
                    to: [{type: 'book'}],
                  }),
                ],
              }),
            ],
          },
        }),
      ],
    }),
  ],
})
