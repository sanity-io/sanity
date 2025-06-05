import {
  Box,
  Button,
  Code,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  Stack,
  Text,
  type Theme,
} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
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
import {css, styled} from 'styled-components'

import {HeaderCell} from './HeaderCell'
import {RowCell} from './RowCell'
import {getInsertTablePatch} from './tablePatches'
import {type Cell, type Table} from './types'
import {getTableDataRows, getTableHeaderRow} from './utils'

const DEBUG = false

const TableContainer = styled.div<{theme: Theme}>((props) => {
  const theme = getTheme_v2(props.theme)
  return css`
    overflow-x: auto;
    overflow-y: auto;
    position: relative;
    border-radius: ${props.theme.sanity.radius[2]}px;
    border: 1px solid ${theme.color.border};
    background: ${theme.color.bg};
    margin-top: ${theme.space[3]}px;
    max-height: 70vh;
  `
})

const StyledTable = styled.table<{theme: Theme}>((props) => {
  const theme = getTheme_v2(props.theme)
  return css`
    width: 100%;
    min-width: max-content;
    border-collapse: separate;
    border-spacing: 0;
    background: ${theme.color.bg};
    font-size: ${theme.font.text.sizes[1].fontSize}px;
    line-height: ${theme.font.text.sizes[1].lineHeight}px;
  `
})

const TableHead = styled.thead<{theme: Theme}>((props) => {
  const theme = getTheme_v2(props.theme)
  return css`
    position: sticky;
    top: 0;
    z-index: 10;
    background: ${theme.color.bg};
  `
})

const TableBody = styled.tbody`
  position: relative;
`

const AddColumnWrapper = styled(Flex)<{theme: Theme}>((props) => {
  const theme = getTheme_v2(props.theme)
  return css`
    padding: ${theme.space[3]}px;
    border-bottom: 1px solid ${theme.color.border};
    background: ${theme.color.bg};
    gap: ${theme.space[2]}px;
    align-items: center;
  `
})

const AddRowWrapper = styled(Box)<{theme: Theme}>((props) => {
  const theme = getTheme_v2(props.theme)
  return css`
    margin-top: ${theme.space[3]}px;
    padding-top: ${theme.space[3]}px;
    border-top: 1px solid ${theme.color.border};
    background: ${theme.color.bg};
  `
})

const DebugWrapper = styled(Stack)<{theme: Theme}>((props) => {
  const theme = getTheme_v2(props.theme)
  return css`
    margin-top: ${props.theme.sanity.space[4]}px;
    padding: ${props.theme.sanity.space[3]}px;
    border: 1px solid ${theme.color.border};
    border-radius: ${props.theme.sanity.radius[2]}px;
    background: ${theme.color.bg};
  `
})

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
        <Stack space={0}>
          <AddColumnWrapper>
            <Text size={1} weight="medium" muted>
              Table columns
            </Text>
            <MenuButton
              button={<Button text="Add column" mode="ghost" />}
              id="menu"
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
          </AddColumnWrapper>

          <TableContainer>
            <StyledTable>
              <TableHead>
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
              </TableHead>
              <TableBody>
                {dataRows?.map((row) => (
                  <tr key={row._key}>
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
              </TableBody>
            </StyledTable>
          </TableContainer>

          <AddRowWrapper>
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
          </AddRowWrapper>
        </Stack>
      )}

      {DEBUG && (
        <DebugWrapper space={3}>
          <Button
            padding={2}
            text="Change mode"
            mode="ghost"
            onClick={() => setMode(mode === 'array' ? 'table' : 'array')}
          />
          <Text size={1}> Value:</Text>
          <Code size={1}>{JSON.stringify(props.value, null, 2)}</Code>
        </DebugWrapper>
      )}
    </>
  )
}
