/* eslint-disable react/jsx-no-bind */
import {AddIcon} from '@sanity/icons'
import {Button, Menu, MenuButton, MenuItem} from '@sanity/ui'
import {uuid} from '@sanity/uuid'
import {useState} from 'react'
import {type ArrayOfObjectsInputProps, FormInput, insert} from 'sanity'

import {createTypeName} from './rowedTable'

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

export function RenderTable(
  props: ArrayOfObjectsInputProps<Table['rows'][number]> & {supportedTypes: {type: string}[]},
) {
  const [mode, setMode] = useState<'array' | 'table'>('array')
  const {onChange} = props
  const headerRow = props.value?.find((row) => row._type === 'headerRow')
  const dataKeys = headerRow?.columns?.map((column) => column.dataKey)
  const dataRows = props.value?.filter((row) => row._type === 'dataRow')
  console.log('data rows', dataRows)
  return (
    <>
      {mode === 'array' ? (
        // @ts-expect-error - fix this
        props.renderDefault(props)
      ) : (
        <div>
          <MenuButton
            button={<Button text="Add column" mode="ghost" />}
            id={`menu`}
            menu={
              <Menu>
                {props.supportedTypes.map((type) => (
                  <MenuItem
                    key={type.type}
                    padding={3}
                    text={createTypeName(type)}
                    onClick={(event) => {
                      const insertPath = []
                      if (headerRow) {
                        insertPath.push({_key: headerRow?._key})
                        insertPath.push(`columns[-1]`)
                      }
                      onChange(
                        insert(
                          [
                            {
                              _type: 'header',
                              _key: uuid(),
                              dataKey: `${type.type}-${uuid()}`,
                              dataType: createTypeName(type),
                              title: `${type.type}`,
                            } satisfies Column,
                          ],
                          'after',
                          insertPath,
                        ),
                      )
                    }}
                  />
                ))}
              </Menu>
            }
            popover={{portal: true, placement: 'bottom-start', tone: 'default'}}
          />
          <Button
            text="Add row"
            mode="ghost"
            onClick={() => {
              onChange(insert([{_type: 'dataRow', _key: uuid(), cells: []}], 'after', [-1]))
            }}
          />

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
                {headerRow?.columns?.map((column) => {
                  const inputProps = {
                    ...props,
                    includeField: true,
                    absolutePath: [
                      'rows',
                      {_key: headerRow?._key},
                      'columns',
                      {_key: column._key},
                      'title',
                    ],
                  }
                  return (
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
                      {/* <Text size={1} weight="medium">
                      {column.title}
                    </Text> */}
                      <FormInput {...inputProps} />
                    </th>
                  )
                })}
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
                    console.log('dataKey', dataKey)
                    const column = headerRow?.columns?.find((c) => c.dataKey === dataKey)
                    if (!column) return null
                    const cellType = props.supportedTypes.find(
                      (t) => createTypeName(t) === column.dataType,
                    )

                    console.log('column', column)
                    const inputProps = {
                      ...props,
                      includeField: true,
                      absolutePath: [
                        'rows',
                        {_key: row._key},
                        'cells',
                        {_key: cell?._key},
                        'value',
                      ],
                    }
                    return (
                      <td
                        key={cell?._key}
                        style={{
                          padding: '12px',
                          borderBottom: '1px solid #e2e8f0',
                          borderRight: '1px solid #e2e8f0',
                        }}
                      >
                        {cell ? (
                          <FormInput {...inputProps} />
                        ) : (
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              height: '100%',
                            }}
                          >
                            <Button
                              icon={AddIcon}
                              mode="bleed"
                              padding={2}
                              onClick={() => {
                                onChange(
                                  insert(
                                    [
                                      {
                                        _key: uuid(),
                                        // TODO: Move to a helper function for creating cell types
                                        _type: `${createTypeName(cellType)}Cell`,
                                        dataKey: dataKey,
                                      },
                                    ],
                                    'after',
                                    [{_key: row._key}, 'cells[-1]'],
                                  ),
                                )
                              }}
                            />
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Button
        padding={2}
        text="Change mode"
        mode="ghost"
        onClick={() => setMode(mode === 'array' ? 'table' : 'array')}
      />
    </>
  )
}
