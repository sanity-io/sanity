import {icons} from '@sanity/icons'
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
    defineField({
      name: 'lazyIcons',
      title: 'Lazy icons',
      description:
        'Portable Text members whose icons come from the `icons` map of `@sanity/icons`, which ' +
        'holds `React.lazy` components. Reload the studio on this document to see the toolbar ' +
        'render while the icons load (#16090).',
      type: 'array',
      of: [
        {
          type: 'block',
          marks: {
            decorators: [
              {title: 'Strong', value: 'strong'},
              {title: 'Highlight', value: 'highlight', icon: icons['highlight']},
            ],
            annotations: [
              {
                name: 'lazyIconLink',
                type: 'object',
                title: 'Link',
                icon: icons['link'],
                fields: [{name: 'href', title: 'URL', type: 'url'}],
              },
            ],
          },
          of: [
            {
              name: 'lazyIconInline',
              type: 'object',
              title: 'Inline video',
              icon: icons['play'],
              fields: [{name: 'url', title: 'URL', type: 'url'}],
            },
          ],
        },
        {
          name: 'lazyIconVideo',
          type: 'object',
          title: 'Video',
          icon: icons['document-video'],
          fields: [{name: 'url', title: 'URL', type: 'url'}],
        },
      ],
    }),
  ],
})
