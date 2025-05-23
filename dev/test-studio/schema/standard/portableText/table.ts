import {defineType} from '@sanity/types'
import {TableComponent} from './tableComponent'

export default defineType({
  name: 'tableColumns',
  title: 'Table',
  type: 'document',
  fields: [
    {
      name: 'columns',
      title: 'Columns',
      components: {
        input: TableComponent,
      },
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'column',
          title: 'Column',
          fields: [
            {
              name: 'title',
              title: 'Title',
              type: 'string',
            },
            {
              type: 'string',
              name: 'rowType',
              title: 'Row type',
              options: {
                list: ['stringObject', 'slug', 'creationDate', 'author', 'book'],
              },
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'rows',
              title: 'Row item',
              type: 'array',
              hidden: (context) => {
                return !context.parent?.rowType
              },
              of: [
                {
                  type: 'object',
                  name: 'stringObject',
                  title: 'Object with string',
                  fields: [
                    {
                      name: 'title',
                      title: 'Title',
                      type: 'string',
                    },
                  ],
                },
                {
                  type: 'slug',
                },
                {
                  type: 'object',
                  name: 'creationDate',
                  title: 'Creation date',
                  fields: [
                    {
                      name: 'date',
                      title: 'Date',
                      type: 'date',
                    },
                  ],
                },
                {
                  name: 'Author',
                  type: 'reference',
                  to: [{type: 'author'}],
                },
                {
                  name: 'book',
                  type: 'reference',
                  to: [{type: 'book'}],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
})
