import {BellIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

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
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [
        {
          type: 'block',
          marks: {
            annotations: [
              defineField({
                name: 'myObject',
                title: 'My Object',
                type: 'object',
                fields: [
                  defineField({
                    name: 'item1',
                    title: 'Item 1',
                    type: 'string',
                  }),
                  defineField({
                    name: 'item2',
                    title: 'Item 2',
                    type: 'string',
                  }),
                  defineField({
                    name: 'item3',
                    title: 'Item 3',
                    type: 'string',
                  }),
                  defineField({
                    name: 'item4',
                    title: 'Item 4',
                    type: 'string',
                  }),
                  defineField({
                    name: 'item5',
                    title: 'Item 5',
                    type: 'string',
                  }),
                  defineField({
                    name: 'item6',
                    title: 'Item 6',
                    type: 'string',
                  }),
                ],
              }),
            ],
          },
        },
      ],
    }),
  ],
})
