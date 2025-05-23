/* eslint-disable react/jsx-no-bind */
import {Text, Button, Menu, MenuButton, MenuItem} from '@sanity/ui'
import {uuid} from '@sanity/uuid'
import {
  ArrayOfObjectsInputMember,
  ArrayOfObjectsInputMembers,
  ContextMenuButton,
  FormInput,
  insert,
  MemberField,
  ObjectInputMember,
  set,
  type ArrayOfObjectsInputProps,
} from 'sanity'
import {createTypeName} from './rowedTable'
import {useState} from 'react'

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
                    const members = props.members
                      .find((m) => m.key === row._key)
                      ?.item.members.find((i) => i.name === 'cells')
                      ?.field.members.find((j) => j.key === cell?._key)?.item.members

                    const member = props.members
                      .find((m) => m.key === row._key)
                      ?.item.members.find((i) => i.name === 'cells')
                      ?.field.members.find((j) => j.key === cell?._key)
                      ?.item.members.find((k) => k.name === 'value')

                    console.log('member', member)
                    const inputProps = {
                      relativePath: ['rows', row._key, 'cells', cell?._key],
                      path: ['value'],
                      renderInput: props.renderInput,
                      renderItem: props.renderItem,
                      renderPreview: props.renderPreview,
                      renderField: props.renderField,
                      renderAnnotation: props.renderAnnotation,
                      renderBlock: props.renderBlock,
                      members: members,
                      schemaType: props.schemaType,
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
                        {cellValue && member ? (
                          <>
                            <ObjectInputMember
                              member={member}
                              renderInput={props.renderInput}
                              renderItem={props.renderItem}
                              renderPreview={props.renderPreview}
                              renderField={props.renderField}
                              renderAnnotation={props.renderAnnotation}
                              renderBlock={props.renderBlock}
                            />
                            {/* <FormInput {...inputProps} /> */}
                          </>
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
