/* eslint-disable react/jsx-no-bind */
import {AddIcon} from '@sanity/icons'
import {Box, Button, Code, Menu, MenuButton, MenuItem, Text} from '@sanity/ui'
import {uuid} from '@sanity/uuid'
import {useState} from 'react'
import {
  type ArrayOfObjectsInputProps,
  type FieldDefinition,
  FormInput,
  type FormPatch,
  insert,
} from 'sanity'

import {type Column, type HeaderRow, type Table} from './types'

const DEBUG = false
function getInsertTablePatch(
  headerRow: HeaderRow | undefined,
  cellType: FieldDefinition,
): FormPatch[] {
  const headerRowKey = headerRow?._key || uuid()

  const patches: FormPatch[] = [
    insert(
      [
        {
          _type: 'header',
          _key: uuid(),
          dataKey: `${cellType.type}-${uuid().slice(0, 4)}`,
          dataType: cellType.name,
          title: `${cellType.title || cellType.name}`,
        } satisfies Column,
      ],
      'after',
      [{_key: headerRowKey}, 'columns', -1],
    ),
  ]
  if (!headerRow) {
    patches.unshift(insert([{_type: 'headerRow', _key: headerRowKey, columns: []}], 'after', [-1]))
  }

  return patches
}

export function RenderTable(
  props: ArrayOfObjectsInputProps<Table['rows'][number]> & {supportedTypes: FieldDefinition[]},
) {
  const [mode, setMode] = useState<'array' | 'table'>('table')
  const {onChange} = props
  const headerRow = props.value?.find((row) => row._type === 'headerRow')
  const dataRows = props.value?.filter((row) => row._type === 'dataRow')

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
                    text={type.title || type.type}
                    onClick={() => {
                      onChange(getInsertTablePatch(headerRow, type))
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
            disabled={!headerRow} // Before adding a data row we need to create the header row
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
                      {/* @ts-expect-error - fix this */}
                      <FormInput
                        {...props}
                        includeField
                        relativePath={[
                          {_key: headerRow?._key},
                          'columns',
                          {_key: column._key},
                          'title',
                        ]}
                      />
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
                  {headerRow?.columns?.map((column) => {
                    const {dataKey, dataType} = column
                    const cell = row.cells?.find((c) => c.dataKey === dataKey)
                    const cellType = props.supportedTypes.find((t) => t.name === dataType)

                    return (
                      <td
                        key={cell?._key || dataKey}
                        style={{
                          padding: '12px',
                          borderBottom: '1px solid #e2e8f0',
                          borderRight: '1px solid #e2e8f0',
                        }}
                      >
                        {cellType ? (
                          <>
                            {cell ? (
                              // @ts-expect-error - fix this
                              <FormInput
                                {...props}
                                includeField
                                relativePath={[
                                  {_key: row._key},
                                  'cells',
                                  {_key: cell?._key},
                                  'value',
                                ]}
                              />
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
                                            _type: cellType?.name,
                                            dataKey: dataKey,
                                          },
                                        ],
                                        'after',
                                        [{_key: row._key}, 'cells', -1],
                                      ),
                                    )
                                  }}
                                />
                              </div>
                            )}
                          </>
                        ) : (
                          <Box key={cell?._key}>
                            <Text>No cell type found</Text>
                          </Box>
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
      {DEBUG && (
        <>
          <Text size={1}> Value:</Text>
          <Code size={1}>{JSON.stringify(props.value, null, 2)}</Code>
        </>
      )}
    </>
  )
}
