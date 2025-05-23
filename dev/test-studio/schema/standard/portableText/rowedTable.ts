import {defineField, defineType} from '@sanity/types'

import {DataKeyCreation, DataKeySelection} from './DataKey'
import {RenderTable} from './RenderTable'

const createTypeName = (type: {type: string; to?: {type: string}[]}) => {
  if (type.type === 'reference') {
    return `${type.type}:${type.to?.[0]?.type}`
  }
  return type.type
}

const supportedTypes = [
  {type: 'string'},
  {type: 'slug'},
  {type: 'date'},
  {type: 'reference', to: [{type: 'author'}]},
]

export default defineType({
  name: 'rowedTable',
  title: 'Table',
  type: 'document',
  fields: [
    {
      name: 'rows',
      title: 'Rows',
      components: {
        input: RenderTable,
      },
      type: 'array',
      validation: (Rule) => {
        return Rule.custom((value) => {
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
                        list: supportedTypes.map(createTypeName),
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
              validation: (Rule) => {
                // DataKey should not be repeated in the same row
                return Rule.custom((value) => {
                  if (!value) {
                    return true
                  }
                  if (!Array.isArray(value)) {
                    return 'Value is not an array'
                  }
                  const dataTypeCounts: Record<string, number> = value.reduce((acc, cell) => {
                    acc[cell.dataKey] = (acc[cell.dataKey] || 0) + 1
                    return acc
                  }, {})
                  const repeatedDataTypes = Object.entries(dataTypeCounts).filter(
                    ([_, count]) => count > 1,
                  )
                  if (repeatedDataTypes.length > 0) {
                    return `Data type ${repeatedDataTypes.map(([type]) => type).join(', ')} is repeated`
                  }
                  return true
                })
              },
              of: supportedTypes.map((type) =>
                defineField({
                  type: 'object',
                  name: `${createTypeName(type)}Cell`,
                  title: type.type,
                  fields: [
                    {
                      name: 'value',
                      ...type,
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
                }),
              ),
            },
          ],
        },
      ],
    },
  ],
})
