import {Text} from '@sanity/ui'
import {ArrayOfPrimitivesItem, type ArrayOfObjectsInputProps} from 'sanity'

interface RootObject {
  _key: string
  _type: string
  columns?: Column[]
  cells?: Cell[]
}

interface Cell {
  _key: string
  _ref?: string
  _type: string
  _strengthenOnPublish?: StrengthenOnPublish
  _weak?: boolean
  date?: string
}

interface StrengthenOnPublish {
  type: string
}

interface Column {
  _key: string
  _type: string
  rowType: string
  title: string
}
const data = [
  {
    _key: '14d50633bc04',
    _type: 'headerRow',
    columns: [
      {
        _key: '2d0182cbb309',
        _type: 'header',
        rowType: 'book',
        title: 'Book',
      },
      {
        _key: '2c3fde695a11',
        _type: 'header',
        rowType: 'author',
        title: 'Author',
      },
      {
        _key: '9a2b3631dbb0',
        _type: 'header',
        rowType: 'creationDate',
        title: 'Creation date',
      },
    ],
  },
  {
    _key: 'a2a2d45d3546',
    _type: 'dataRow',
    cells: [
      {
        _key: '6f6cb6afb263',
        _ref: '032bc395-f11c-43c0-96b4-a346a950c6b0',
        _type: 'book',
      },
      {
        _key: 'fb200539c7b5',
        _ref: '02bb2ad2-9890-4f36-a03b-3b51c291ce2b',
        _strengthenOnPublish: {
          type: 'author',
        },
        _type: 'Author',
        _weak: true,
      },
      {
        _key: '67ac39f7c1ef',
        _type: 'creationDate',
        date: '2025-05-16',
      },
    ],
  },
]

export function RowedTableComponent(props: ArrayOfObjectsInputProps<RootObject[]>) {
  const headerRow = props.value?.find((row) => row._type === 'headerRow')
  const dataKeys = headerRow?.columns?.map((column) => column.dataKey)
  const dataRows = props.value?.filter((row) => row._type === 'dataRow')
  console.log('Props', props)
  return (
    <>
      {props.renderDefault(props)}
      <table>
        <thead>
          <tr>{headerRow?.columns?.map((column) => <th key={column._key}>{column.title}</th>)}</tr>
        </thead>
        <tbody>
          {dataRows?.map((row) => (
            <tr key={row._key}>
              {dataKeys?.map((dataKey) => {
                const cell = row.cells?.find((cell) => cell.dataKey === dataKey)?.value
                console.log('Cell', cell)
                return (
                  <td key={cell?._key}>
                    {/* <ArrayOfPrimitivesItem
                      member={props.members.find((member) => member.name === dataKey)}
                      renderItem={props.renderItem}
                      renderInput={props.renderInput}
                    /> */}
                    {cell ? (
                      <Text size={1}>
                        {typeof cell === 'string'
                          ? cell
                          : cell?._type === 'creationDate' && cell.date
                            ? cell.date
                            : cell._ref
                              ? `Reference: ${cell._ref}`
                              : cell._type === 'slug'
                                ? cell.current
                                : JSON.stringify(cell, null, 2)}
                      </Text>
                    ) : (
                      <Text size={1}>No data</Text>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
