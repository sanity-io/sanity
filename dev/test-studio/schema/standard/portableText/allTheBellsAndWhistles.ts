import {BellIcon, ColorWheelIcon, DocumentPdfIcon, ImageIcon, InfoOutlineIcon} from '@sanity/icons'
import {type Rule} from '@sanity/types'
import {defineArrayMember, defineField, defineType} from 'sanity'

import {InfoBoxPreview} from './InfoBoxPreview'

export const ptAllTheBellsAndWhistlesType = defineType({
  type: 'document',
  icon: BellIcon,
  name: 'pt_allTheBellsAndWhistles',
  title: 'All the bells & whistles',
  fieldsets: [
    {
      name: 'whitespace',
      title: 'Whitespace',
    },
  ],
  fields: [
    defineField({
      type: 'string',
      name: 'title',
      title: 'Title',
      placeholder: 'Enter a title',
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
              defineField({
                type: 'object',
                name: 'link',
                title: 'Link',
                // options: {
                //   modal: {type: 'dialog'},
                // },
                fields: [
                  defineField({
                    type: 'url',
                    name: 'href',
                    title: 'URL',
                    validation: (rule) =>
                      rule
                        .custom((url: string | undefined, context: any) => {
                          if (!url && !context.parent.reference) {
                            return 'Inline Link: Requires a reference or URL'
                          }

                          return true
                        })
                        .uri({
                          scheme: ['http', 'https', 'mailto', 'tel'],
                          allowRelative: true,
                        }),
                  }),
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
              }),
              defineField({
                type: 'object',
                name: 'color',
                title: 'Color',
                icon: ColorWheelIcon,
                fields: [
                  {
                    type: 'string',
                    name: 'color',
                    title: 'Color',
                    validation: (rule: Rule) => rule.required(),
                  },
                ],
              }),
            ],
          },
          of: [
            defineField({
              type: 'object',
              name: 'inlineImage',
              preview: {
                select: {
                  media: 'asset',
                },
              },
              fields: [
                defineField({
                  name: 'inlineImage',
                  type: 'image',
                  title: 'Inline image',
                }),
                defineField({
                  name: 'caption',
                  type: 'string',
                  title: 'Caption',
                  validation: (rule) => rule.required(),
                }),
              ],
            }),
          ],
        }),

        defineField({
          type: 'file',
          icon: DocumentPdfIcon,
          name: 'pdfFile',
          title: 'PDF file',
          options: {
            accept: 'application/pdf',
          },
          preview: {
            select: {
              title: 'asset.originalFilename',
            },
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
            },
          },
          fields: [
            defineField({
              title: 'Caption',
              name: 'caption',
              type: 'string',
              validation: (rule) => rule.required(),
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
          name: 'imageObject',
          title: 'Image object',
          type: 'object',
          icon: ImageIcon,
          fields: [
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
                },
              },
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
              name: 'content',
              type: 'array',
              of: [{type: 'block'}],
              validation: (rule) => rule.required().error('Must have content'),
            }),
            defineField({
              title: 'Nested object',
              name: 'nestedObject',
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

    // Whitespace testing
    defineField({
      type: 'array',
      name: 'whitespacePreserve',
      title: 'Whitespace: Preserve',
      fieldset: 'whitespace',
      of: [
        defineArrayMember({
          type: 'block',
          name: 'block',
          title: 'Block',
        }),
      ],
    }),
    defineField({
      type: 'array',
      name: 'whitespaceRemove',
      title: 'Whitespace: remove',
      fieldset: 'whitespace',
      of: [
        defineArrayMember({
          type: 'block',
          name: 'block',
          title: 'Block',
          options: {
            unstable_whitespaceOnPasteMode: 'remove',
          },
        }),
      ],
    }),
    defineField({
      type: 'array',
      name: 'whitespaceNormalize',
      title: 'Whitespace: Normalize',
      fieldset: 'whitespace',
      of: [
        defineArrayMember({
          type: 'block',
          name: 'block',
          title: 'Block',
          options: {
            unstable_whitespaceOnPasteMode: 'normalize',
          },
        }),
      ],
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
        }),
        defineArrayMember({
          type: 'object',
          name: 'imagesWithCaption',
          title: 'Image slideshow',
          fields: [
            {
              type: 'array',
              name: 'images',
              of: [
                {
                  type: 'object',
                  name: 'imageWithCaption',
                  fields: [
                    {
                      type: 'image',
                      name: 'image',
                      options: {
                        hotspot: true,
                      },
                      fields: [{type: 'string', name: 'alt'}],
                    },
                    {
                      type: 'array',
                      name: 'caption',
                      of: [{type: 'block'}],
                    },
                  ],
                },
              ],
            },
          ],
        }),
      ],
    }),
    defineField({
      name: 'content',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'something',
          type: 'block',
          of: [
            defineArrayMember({
              name: 'nested',
              type: 'object',
              fields: [
                defineField({
                  name: 'items',
                  type: 'array',
                  of: [
                    defineArrayMember({
                      name: 'item',
                      type: 'object',
                      fields: [
                        defineField({
                          name: 'deep',
                          type: 'array',
                          of: [
                            defineArrayMember({
                              type: 'block',
                              styles: [
                                {title: 'Normal', value: 'normal'},
                                {title: 'H2', value: 'h2'},
                                {title: 'H3', value: 'h3'},
                                {title: 'H4', value: 'h4'},
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  ],
})
