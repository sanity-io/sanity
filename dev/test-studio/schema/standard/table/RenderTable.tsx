import {Box, Button, Code, Menu, MenuButton, MenuItem, Text} from '@sanity/ui'
import {uuid} from '@sanity/uuid'
import {useMemo, useState} from 'react'
import {
  type ArraySchemaType,
  type FieldDefinition,
  FormInput,
  insert,
  type ObjectField,
  type ObjectInputProps,
  type ObjectSchemaType,
} from 'sanity'

import {HeaderCell} from './HeaderCell'
import {RowCell} from './RowCell'
import {getInsertTablePatch} from './tablePatches'
import {type Cell, type Table} from './types'
import {getTableDataRows, getTableHeaderRow} from './utils'

const DEBUG = false

export function RenderTable(
  props: ObjectInputProps<Table, ObjectSchemaType> & {supportedTypes: FieldDefinition[]},
) {
  const [mode, setMode] = useState<'array' | 'table'>('table')
  const {onChange} = props
  const headerRow = getTableHeaderRow(props.value)
  const dataRows = getTableDataRows(props.value)

  const dataRowSchemaType = useMemo(() => {
    const rows = props.schemaType.fields.find(
      (f) => f.name === 'rows',
    ) as ObjectField<ArraySchemaType>
    const dataRow = rows?.type.of.find((t) => t.name === 'dataRow') as ObjectSchemaType | undefined
    return dataRow?.fields?.find((f) => f.name === 'cells')?.type as
      | ArraySchemaType<ObjectSchemaType>
      | undefined
  }, [props.schemaType])

  return (
    <>
      {mode === 'array' ? (
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
                    <HeaderCell
                      key={column._key}
                      column={column}
                      headerRow={headerRow}
                      onChange={onChange}
                    >
                      <FormInput
                        {...props}
                        includeField={false}
                        relativePath={[
                          'rows',
                          {_key: headerRow?._key},
                          'columns',
                          {_key: column._key},
                          'title',
                        ]}
                      />
                    </HeaderCell>
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
                    const cell = row.cells?.find((c) => c.dataKey === dataKey) as Cell | undefined
                    const cellType = props.supportedTypes.find((t) => t.name === dataType)

                    const arrayCellSchemaType = dataRowSchemaType?.of?.find(
                      (f) => f.name === dataType,
                    ) as ObjectSchemaType | undefined

                    const fieldValueSchemaType = arrayCellSchemaType?.fields.find(
                      (f) => f.name === 'value',
                    )
                    return (
                      <RowCell
                        key={cell?._key || dataKey}
                        dataRow={row}
                        onChange={onChange}
                        cell={cell}
                        cellType={cellType}
                        fieldValueSchemaType={fieldValueSchemaType}
                        column={column}
                        input={
                          <FormInput
                            {...props}
                            includeField
                            relativePath={[
                              'rows',
                              {_key: row._key},
                              'cells',
                              {_key: cell?._key || ''},
                              'value',
                            ]}
                          />
                        }
                      />
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <Box marginTop={2}>
            <Button
              text="Add row"
              width="fill"
              mode="ghost"
              disabled={!headerRow} // Before adding a data row we need to create the header row
              onClick={() => {
                onChange(
                  insert([{_type: 'dataRow', _key: uuid(), cells: []}], 'after', ['rows', -1]),
                )
              }}
            />
          </Box>
        </div>
      )}

      {DEBUG && (
        <>
          <Button
            padding={2}
            text="Change mode"
            mode="ghost"
            onClick={() => setMode(mode === 'array' ? 'table' : 'array')}
          />
          <Text size={1}> Value:</Text>
          <Code size={1}>{JSON.stringify(props.value, null, 2)}</Code>
        </>
      )}
    </>
  )
}
