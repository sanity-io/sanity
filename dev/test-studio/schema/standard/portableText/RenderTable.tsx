import {Text} from '@sanity/ui'
import {type ArrayOfObjectsInputProps} from 'sanity'

interface HeaderRow {
  _key: string
  _type: 'headerRow'
  columns: Column[]
}
export interface DataRow {
  _key: string
  _type: 'dataRow'
  cells: Cell[]
}
export interface Table {
  rows: (HeaderRow | DataRow)[]
}

interface Cell {
  _key: string
  _type: string
  dataKey: string
  value: any
}

interface Column {
  _key: string
  _type: 'header'
  dataKey: string
  dataType: string
  title: string
}

export function RenderTable(props: ArrayOfObjectsInputProps<Table['rows'][number]>) {
  const headerRow = props.value?.find((row) => row._type === 'headerRow')
  const dataKeys = headerRow?.columns?.map((column) => column.dataKey)
  const dataRows = props.value?.filter((row) => row._type === 'dataRow')
  console.log('Props', props)
  return (
    <>
      {/* @ts-expect-error - : fix this */}
      {props.renderDefault(props)}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginTop: '1rem',
          border: '1px solid #e2e8f0',
        }}
      >
        <thead>
          <tr>
            {headerRow?.columns?.map((column) => (
              <th
                key={column._key}
                style={{
                  padding: '12px',
                  textAlign: 'left',
                  backgroundColor: '#f8fafc',
                  borderBottom: '2px solid #e2e8f0',
                  borderRight: '1px solid #e2e8f0',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                }}
              >
                <Text size={1} weight="medium">
                  {column.title}
                </Text>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataRows?.map((row) => (
            <tr
              key={row._key}
              style={{
                borderBottom: '1px solid #e2e8f0',
              }}
            >
              {dataKeys?.map((dataKey) => {
                const cell = row.cells?.find((c) => c.dataKey === dataKey)
                const cellValue = cell?.value
                return (
                  <td
                    key={cell?._key}
                    style={{
                      padding: '12px',
                      borderBottom: '1px solid #e2e8f0',
                      borderRight: '1px solid #e2e8f0',
                    }}
                  >
                    {/* <ArrayOfPrimitivesItem
                      member={props.members.find((member) => member.name === dataKey)}
                      renderItem={props.renderItem}
                      renderInput={props.renderInput}
                    /> */}
                    {cellValue ? (
                      <Text size={1}>
                        {typeof cellValue === 'string'
                          ? cellValue
                          : cellValue?._type === 'creationDate' && cellValue.date
                            ? cellValue.date
                            : cellValue._ref
                              ? `Reference: ${cellValue._ref}`
                              : cellValue._type === 'slug'
                                ? cellValue.current
                                : JSON.stringify(cellValue, null, 2)}
                      </Text>
                    ) : (
                      <Text size={1} muted>
                        ---
                      </Text>
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
