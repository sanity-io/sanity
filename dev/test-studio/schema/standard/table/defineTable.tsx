import {type ArrayOfObjectsInputProps, defineField, type FieldDefinition} from 'sanity'
import {styled} from 'styled-components'

import {DataKeyCreation, DataKeySelection} from './DataKey'
import {RenderTable} from './RenderTable'
import {type Cell, type Table} from './types'

const TableFieldWrapper = styled.div`
  & > div > div > div[data-ui='fieldHeaderContentBox'] {
    display: none;
  }
`

export function defineTable(supportedFields: FieldDefinition[]) {
  return defineField({
    name: 'table',
    type: 'object',
    fields: [
      {
        name: 'rows',
        title: 'Rows',
        components: {
          input: (props: ArrayOfObjectsInputProps<Table['rows'][number]>) => (
            <RenderTable {...props} supportedTypes={supportedFields} />
          ),
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
              defineField({
                name: 'columns',
                title: 'Column Headers',
                type: 'array',
                of: [
                  defineField({
                    type: 'object',
                    name: 'header',
                    title: 'Header',
                    fields: [
                      defineField({
                        name: 'title',
                        title: 'Title',
                        type: 'string',
                        components: {
                          field: (props) => (
                            <TableFieldWrapper>{props.renderDefault(props)}</TableFieldWrapper>
                          ),
                        },
                      }),
                      defineField({
                        type: 'string',
                        name: 'dataType',
                        title: 'Data type',
                        options: {
                          list: supportedFields.map((sf) => sf.name),
                        },
                        validation: (Rule) => Rule.required(),
                      }),
                      defineField({
                        name: 'dataKey',
                        title: 'Data key',
                        type: 'string',
                        components: {
                          input: DataKeyCreation,
                        },
                        readOnly: true,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          },
          {
            type: 'object',
            name: 'dataRow',
            title: 'Data Row',
            fields: [
              defineField({
                name: 'cells',
                title: 'Cells',
                type: 'array',
                validation: (Rule) => {
                  // DataKey should not be repeated in the same row
                  return Rule.custom((value: Cell[] | undefined) => {
                    if (!value) return true
                    if (!Array.isArray(value)) return 'Value is not an array'

                    const dataTypeCounts = value.reduce(
                      (acc, cell) => {
                        acc[cell.dataKey] = (acc[cell.dataKey] || 0) + 1
                        return acc
                      },
                      {} as Record<string, number>,
                    )
                    const repeatedDataTypes = Object.entries(dataTypeCounts).filter(
                      ([_, count]) => count > 1,
                    )
                    if (repeatedDataTypes.length > 0) {
                      return `Data type ${repeatedDataTypes.map(([type]) => type).join(', ')} is repeated`
                    }
                    return true
                  })
                },
                of: supportedFields.map((type) =>
                  defineField({
                    type: 'object',
                    name: type.name,
                    title: type.title || type.type,
                    fields: [
                      defineField({
                        components: {
                          field: (props) => (
                            <TableFieldWrapper>{props.renderDefault(props)}</TableFieldWrapper>
                          ),
                        },
                        ...type,
                        name: 'value',
                      }),
                      defineField({
                        name: 'dataKey',
                        type: 'string',
                        readOnly: (context) => Boolean(context.value),
                        components: {
                          input: DataKeySelection,
                        },
                      }),
                    ],
                  }),
                ),
              }),
            ],
          },
        ],
      },
    ],
  })
}
