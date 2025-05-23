import {defineType} from '@sanity/types'

import {DataKeyCreation, DataKeySelection} from './DataKey'
import {RowedTableComponent} from './RowedTableCompo'

export default defineType({
  name: 'rowedTable',
  title: 'Rowed Table',
  type: 'document',
  fields: [
    {
      name: 'rows',
      title: 'Rows',
      components: {
        input: RowedTableComponent,
      },
      type: 'array',
      validation: (Rule) => {
        return Rule.custom((value, context) => {
          if (!value) {
            return true
          }
          if (!Array.isArray(value)) {
            return 'Value is not an array'
          }
          // Validate it only has 1 header row and it is the first row
          const headerRows = value.filter((row) => row._type === 'headerRow')
          if (headerRows.length > 1) {
            return 'Only one header row is allowed'
          }
          const headerRowIndex = value.findIndex((row) => row._type === 'headerRow')
          if (headerRowIndex !== 0) {
            return 'Header row should be the first row'
          }

          return true
        })
      },
      of: [
        {
          type: 'object',
          name: 'headerRow',
          title: 'Header Row',
          preview: {
            select: {
              columns: 'columns',
            },
            prepare: ({columns}) => ({
              title: `Header: ${columns.map((column: {title: string}) => column.title).join(' | ')}`,
            }),
          },

          fields: [
            {
              name: 'columns',
              title: 'Column Headers',
              type: 'array',
              of: [
                {
                  type: 'object',
                  name: 'header',
                  title: 'Header',
                  fields: [
                    {
                      name: 'title',
                      title: 'Title',
                      type: 'string',
                    },
                    {
                      type: 'string',
                      name: 'dataType',
                      title: 'Data type',
                      options: {
                        list: ['stringObject', 'slug', 'creationDate', 'author'],
                      },
                      validation: (Rule) => Rule.required(),
                    },
                    {
                      name: 'dataKey',
                      title: 'Data key',
                      type: 'string',
                      components: {
                        input: DataKeyCreation,
                      },
                      readOnly: true,
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'object',
          name: 'dataRow',
          title: 'Data Row',
          fields: [
            {
              name: 'cells',
              title: 'Cells',
              type: 'array',
              options: {
                layout: 'grid',
              },
              of: [
                {
                  type: 'object',
                  name: 'stringObject',
                  title: 'String',
                  initialValue: (...context) => {
                    console.log('Initial value context for string', context)
                    return {}
                  },
                  fields: [
                    {
                      name: 'value',
                      type: 'string',
                    },
                    {
                      name: 'dataKey',
                      type: 'string',
                      readOnly: (context) => Boolean(context.value),
                      components: {
                        input: DataKeySelection,
                      },
                    },
                  ],
                },
                {
                  type: 'object',
                  name: 'slugObject',
                  title: 'Slug',
                  fields: [
                    {
                      name: 'value',
                      type: 'slug',
                    },
                    {
                      name: 'dataKey',
                      type: 'string',
                      readOnly: (context) => Boolean(context.value),
                      components: {
                        input: DataKeySelection,
                      },
                    },
                  ],
                },
                {
                  type: 'object',
                  name: 'creationDate',
                  title: 'Creation date',
                  fields: [
                    {
                      name: 'value',
                      type: 'date',
                    },
                    {
                      name: 'dataKey',
                      type: 'string',
                      readOnly: (context) => Boolean(context.value),
                      components: {
                        input: DataKeySelection,
                      },
                    },
                  ],
                },
                {
                  type: 'object',
                  name: 'author',
                  title: 'Author',
                  fields: [
                    {
                      name: 'value',
                      type: 'reference',
                      to: [{type: 'author'}],
                    },
                    {
                      name: 'dataKey',
                      type: 'string',
                      readOnly: (context) => Boolean(context.value),
                      components: {
                        input: DataKeySelection,
                      },
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
