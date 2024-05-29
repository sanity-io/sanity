import {defineField, defineType} from 'sanity'

const animal = defineField({
  type: 'object',
  name: 'contentobj',
  title: 'Content',
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Title',
    },
    {
      type: 'array',
      name: 'heading',
      title: 'Heading',
      of: [
        {type: 'block'},
        {
          type: 'object',
          name: 'info',
          fields: [
            {
              type: 'array',
              name: 'item',
              title: 'Item',
              of: [
                {
                  type: 'object',
                  name: 'property',
                  title: 'Property',
                  fields: [
                    {
                      type: 'string',
                      name: 'title',
                      title: 'Title',
                    },
                    {
                      type: 'string',
                      name: 'value',
                      title: 'Value',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'array',
      name: 'section',
      of: [
        {
          type: 'object',
          name: 'narrativeSection',
          fields: [
            {
              name: 'narrativeTitle',
              type: 'string',
              title: 'title',
              validation: (Rule) => Rule.required(),
            },

            {
              type: 'array',
              name: 'narrativeHeading',
              title: 'Heading',
              of: [
                {type: 'block'},
                {
                  type: 'object',
                  name: 'info',
                  fields: [
                    {
                      type: 'array',
                      name: 'item',
                      title: 'Item',
                      of: [
                        {
                          type: 'object',
                          name: 'property',
                          title: 'Property',
                          fields: [
                            {
                              type: 'string',
                              name: 'title',
                              title: 'Title',
                            },
                            {
                              type: 'string',
                              name: 'value',
                              title: 'Value',
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              name: 'cta',
              type: 'array',
              title: 'Call to Action',
              of: [
                {
                  type: 'object',
                  name: 'subsectionObj',
                  title: 'Call to Action',
                  fields: [
                    {
                      type: 'string',
                      name: 'label',
                      title: 'Label',
                      description: 'The text that will display on the button',
                    },
                    {
                      type: 'string',
                      name: 'accessibleLabel',
                      description:
                        'When the purpose of the button is not clear from the label out of context, provide a more descriptive label for screen readers ',
                      title: 'Accessible Label',
                    },
                    {
                      type: 'string',
                      name: 'url',
                      title: 'URL',
                      description:
                        'The URL the button should link to, you can also paste an internal link to find a reference',
                    },
                  ],
                },
              ],
            },
            {
              name: 'blocktype',
              type: 'array',
              title: 'Blockquote',
              of: [
                {
                  type: 'object',
                  name: 'blockquoteOb',
                  title: 'Blockquote',
                  fields: [
                    {
                      type: 'string',
                      name: 'blockquoteName',
                      title: 'Name',
                    },
                    {
                      type: 'array',
                      name: 'quote',
                      title: 'Quote',
                      of: [{type: 'block'}],
                    },
                    {
                      type: 'image',
                      name: 'profile',
                      title: 'Profile Image',
                    },
                    {
                      type: 'array',
                      name: 'companies',
                      title: 'Companies',
                      of: [
                        {
                          type: 'object',
                          name: 'company',
                          fields: [
                            {
                              type: 'string',
                              name: 'name',
                              title: 'Name',
                            },
                            {
                              type: 'string',
                              name: 'position',
                              title: 'Position',
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
})

const animals = defineField({
  type: 'array',
  name: 'content',
  title: 'Content',
  of: [animal],
})

export const homepage = defineType({
  name: 'homepage',
  title: 'Homepage',
  type: 'document',
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Title',
    },
    {
      name: 'seoTitle',
      type: 'string',
      title: 'seoTitle',
    },
    animals,
  ],
})
