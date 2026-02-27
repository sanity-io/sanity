/**
 * Reproduction schema for https://github.com/sanity-io/sanity/issues/5554
 *
 * Issue: Array of strings with a custom input does not appear as expected
 * in `layout: "grid"` and each item takes a full row.
 */
import {defineField, defineType} from 'sanity'

import {GridColorStringInput} from './components/GridColorStringInput'

export const arrayOfStringsGridCustomInput = defineType({
  name: 'arrayOfStringsGridCustomInputTest',
  type: 'document',
  title: 'Array Grid + Custom String Input (#5554)',
  description:
    'Manual repro for issue #5554: array of strings + custom input + options.layout="grid".',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      initialValue: 'Issue #5554 repro',
    }),
    defineField({
      name: 'colors',
      title: 'Colors',
      type: 'array',
      description:
        'Each color uses a tiny custom string input. In a correct grid layout, items should stay compact.',
      of: [
        defineField({
          name: 'color',
          type: 'string',
          components: {
            input: GridColorStringInput,
          },
        }),
      ],
      options: {
        layout: 'grid',
      },
      initialValue: ['#ff3366', '#7c3aed', '#0ea5e9', '#22c55e', '#f59e0b'],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'colors',
    },
    prepare({subtitle, title}) {
      const count = Array.isArray(subtitle) ? subtitle.length : 0
      return {
        title: title || 'Array Grid + Custom String Input (#5554)',
        subtitle: `${count} color${count === 1 ? '' : 's'}`,
      }
    },
  },
})
