import {defineField, defineType} from 'sanity'

import {LazyFieldA} from './components/lazy/LazyFieldA'
import {LazyInputA} from './components/lazy/LazyInputA'
import {LazyInputB} from './components/lazy/LazyInputB'

export default defineType({
  name: 'lazyComponents',
  title: 'Lazy Components',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      description: 'Lazy input.',
      type: 'string',
      components: {
        input: LazyInputA,
      },
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      description: 'Lazy field.',
      type: 'slug',
      components: {
        field: LazyFieldA,
      },
    }),
    defineField({
      name: 'body',
      title: 'Body',
      description:
        'Portable Text field containing lazy elements (e.g. annotations with lazy inputs).',
      type: 'array',
      of: [
        {
          type: 'block',
          marks: {
            annotations: [
              {
                name: 'annotation',
                type: 'object',
                title: 'Annotation',
                fields: [
                  {
                    name: 'title',
                    title: 'Title',
                    description: 'Lazy input.',
                    type: 'string',
                    components: {
                      input: LazyInputB,
                    },
                  },
                ],
              },
            ],
          },
        },
      ],
    }),
  ],
})
