import {defineAssetAspect, defineField, defineArrayMember} from 'sanity'

const languages = [
  {title: 'Dutch', value: 'nl'},
  {title: 'English', value: 'en'},
  {title: 'French', value: 'fr'},
  {title: 'German', value: 'de'},
]

export default defineAssetAspect({
  name: 'altText',
  title: 'Alternative text',
  description: 'Accessible alternative text for this asset, in one or more languages.',
  type: 'array',
  of: [
    defineArrayMember({
      name: 'altTextItem',
      type: 'object',
      fields: [
        defineField({
          name: 'language',
          type: 'string',
          description: 'The language that the alt text is written in',
          options: {
            list: languages,
            layout: 'radio',
          },
        }),
        defineField({
          name: 'value',
          title: 'Alternative text',
          type: 'string',
          description: 'Short description of the image, for screen readers (max ~100 characters).',
        }),
      ],
      preview: {
        select: {
          title: 'value',
          subtitle: 'language',
        },
      },
    }),
  ],
})
