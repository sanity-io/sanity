import {LinkIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

import {SimpleTestInput} from '../components/SimpleTestInput'

export const simpleTestSchema = defineType({
  type: 'document',
  name: 'simpleTestSchema',
  title: 'Simple document',
  components: {input: SimpleTestInput},
  fields: [
    defineField({
      type: 'string',
      name: 'title',
      title: 'Title',
    }),
    defineField({
      type: 'array',
      name: 'links',
      title: 'links',
      description: 'For use in menu',
      of: [
        defineField({
          type: 'object',
          name: 'link',
          title: 'link in menu',
          icon: LinkIcon,
          fields: [
            defineField({
              type: 'string',
              name: 'name',
              title: 'Name',
              validation: (Rule) => Rule.required().error('Navn på lenke er påkrevd'),
            }),
            defineField({
              type: 'url',
              name: 'url',
              title: 'Link',
              validation: (Rule) => Rule.required().error('Lenke er påkrevd'),
            }),
            defineField({
              type: 'string',
              name: 'id',
              title: 'ID',
              description: 'For bruk til markering av link i URL (Avansert)',
            }),
          ],
        }),
      ],
    }),
  ],
})
