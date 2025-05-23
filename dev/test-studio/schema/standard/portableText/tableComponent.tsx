import {Box, Text} from '@sanity/ui'
import {ReferencePreview} from 'packages/sanity/src/core/form/inputs/ReferenceInput/ReferencePreview'
import {type ComponentType} from 'react'
import {DefaultPreview, Preview, PreviewCard, type ArrayOfObjectsInputProps} from 'sanity'

interface Column {
  _key: string
  title: string
  rowType: string
  rows: Row[]
}

type Row = {
  _key: string
  title: string
} | null

export function TableComponent(props: ArrayOfObjectsInputProps<Column>) {
  console.log('props', props)
  const rowsMaxLength = Math.max(...(props.value?.map((column) => column.rows?.length || 0) || [0]))
  const rows: Row[][] = Array.from({length: rowsMaxLength}, (_, index) =>
    props.value?.map((column) => column.rows?.[index] || null),
  ).filter(Boolean) as Row[][]

  return (
    <>
      {props.renderDefault(props)}
      <table>
        <thead>{props.value?.map((column) => <th key={column._key}>{column.title}</th>)}</thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row?.[0]?._key}>
              {row.map((cell) => (
                <td key={cell?._key}>
                  <Text size={1}>
                    {cell?._type === 'creationDate' && cell.date
                      ? cell.date
                      : cell?._ref
                        ? `Reference: ${cell._ref}`
                        : JSON.stringify(cell, null, 2)}
                  </Text>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
