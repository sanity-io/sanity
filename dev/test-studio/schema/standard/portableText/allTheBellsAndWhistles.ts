import {BellIcon, ImageIcon, InfoOutlineIcon} from '@sanity/icons'
import {Rule} from '@sanity/types'
import {defineArrayMember, defineField, defineType} from 'sanity'
import {InfoBoxPreview} from './InfoBoxPreview'

export const ptAllTheBellsAndWhistlesType = defineType({
  type: 'document',
  icon: BellIcon,
  name: 'pt_allTheBellsAndWhistles',
  title: 'All the bells & whistles',
  fields: [
    defineField({
      type: 'string',
      name: 'title',
      title: 'Title',
    }),
    defineField({
      type: 'array',
      name: 'text',
      title: 'Text',
      of: [
        defineArrayMember({
          type: 'block',
          name: 'block',
          title: 'Block',

          // styles: [{title: 'Normal', value: 'normal'}],
          marks: {
            // decorators: [{title: 'Strong', value: 'strong'}],
            annotations: [
              {
                type: 'object',
                name: 'link',
                title: 'Link',
                // options: {
                //   modal: {type: 'dialog'},
                // },
                fields: [
                  {
                    type: 'url',
                    name: 'href',
                    title: 'URL',
                    validation: (rule: Rule) =>
                      rule
                        .custom((url: string, context: any) => {
                          if (!url && !context.parent.reference) {
                            return 'Inline Link: Requires a reference or URL'
                          }

                          return true
                        })
                        .uri({
                          scheme: ['http', 'https', 'mailto', 'tel'],
                          allowRelative: true,
                        }),
                  },
                  defineField({
                    title: 'Linked Book',
                    name: 'reference',
                    type: 'reference',
                    to: [{type: 'book'}],
                    description: '',
                  }),
                  {
                    type: 'boolean',
                    name: 'newTab',
                    title: 'Open in new tab?',
                    description: 'Will open the link in a new tab when checked.',
                    initialValue: false,
                  },
                ],
              },
            ],
          },
        }),

        defineField({
          type: 'image',
          icon: ImageIcon,
          name: 'image',
          title: 'Image',
          options: {
            hotspot: true,
          },
          preview: {
            select: {
              media: 'asset',
              title: 'caption',
            },
          },
          fields: [
            defineField({
              title: 'Caption',
              name: 'caption',
              type: 'string',
            }),
            {
              name: 'alt',
              type: 'string',
              title: 'Alt text',
              description: 'Alternative text for screenreaders. Falls back on caption if not set',
            },
            {
              title: 'Enable lightbox',
              description:
                '❓ Optional. The default behavior is to enable it if image is large enough to benefit from it.',
              name: 'enableLightbox',
              type: 'boolean',
            },
            {
              title: 'Icon',
              name: 'isIcon',
              type: 'boolean',
            },
            {
              title: 'Disable shadow',
              description: 'Not implemented in most surfaces.',
              name: 'disableShadow',
              type: 'boolean',
            },
            defineField({
              title: 'Large',
              description: 'Not implemented in most surfaces.',
              name: 'isLarge',
              type: 'boolean',
            }),
          ],
        }),

        defineField({
          name: 'infoBox',
          icon: InfoOutlineIcon,
          title: 'Info Box',
          type: 'object',
          fields: [
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: (rule) => rule.required().warning('Should have a title'),
            }),
            defineField({
              title: 'Box Content',
              name: 'body',
              type: 'array',
              of: [{type: 'block'}],
              validation: (rule) => rule.required().error('Must have content'),
            }),
          ],
          components: {
            preview: InfoBoxPreview as any,
          },
          preview: {
            select: {
              title: 'title',
              body: 'body',
            },
            prepare({title, body}) {
              return {title, body}
            },
          },
        }),
      ],
    }),
  ],
})
