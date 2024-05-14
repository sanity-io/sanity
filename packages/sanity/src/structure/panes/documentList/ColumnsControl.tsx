/* eslint-disable @sanity/i18n/no-attribute-string-literals */
/* eslint-disable i18next/no-literal-string */
import {Box, Button, Card, Checkbox, Flex, Menu, MenuButton, Stack, Text} from '@sanity/ui'
import {type Column, type Table} from '@tanstack/react-table'
import {useEffect, useRef, useState} from 'react'
import {type SanityDocument} from 'sanity'

const VISIBLE_COLUMN_LIMIT = 5

type Props = {
  table: Table<SanityDocument>
}

export function ColumnsControl({table}: Props) {
  const tableRef = useRef(table)
  const [reset, setReset] = useState(0)

  const isVisibleLimitReached =
    table.getVisibleLeafColumns().filter((col) => col.getCanHide()).length >= VISIBLE_COLUMN_LIMIT

  // set the initial visible columns state
  useEffect(() => {
    const [newColumns]: [Record<string, boolean>, number] = tableRef.current
      .getAllLeafColumns()
      .reduce(
        ([accCols, countAllowedVisible], column) => {
          // this column is always visible
          if (!column.getCanHide()) {
            return [{...accCols, [column.id]: true}, countAllowedVisible]
          }

          // have already reached column visibility limit, hide column by default
          if (countAllowedVisible === VISIBLE_COLUMN_LIMIT) {
            return [{...accCols, [column.id]: false}, countAllowedVisible]
          }

          return [{...accCols, [column.id]: true}, countAllowedVisible + 1]
        },
        [{}, 0],
      )

    tableRef.current.setColumnVisibility(newColumns)
  }, [reset])

  const handleColumnOnChange = (column: Column<SanityDocument, unknown>) => () => {
    column.toggleVisibility()
  }

  const handleResetColumns = () => setReset((prev) => prev + 1)

  return (
    <MenuButton
      button={<Button text="Columns" />}
      id="columns-control"
      menu={
        <Menu padding={3} paddingBottom={1} style={{maxHeight: 300, overflow: 'scroll'}}>
          <Button size={0} text="Reset" onClick={handleResetColumns} />
          <Stack>
            {table
              .getAllLeafColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <Flex key={column.id} marginY={2} align="center">
                  <Checkbox
                    readOnly={isVisibleLimitReached && !column.getIsVisible()}
                    checked={column.getIsVisible()}
                    onChange={handleColumnOnChange(column)}
                    id={`col-visibility-${column.id}`}
                    style={{display: 'block'}}
                  />
                  <Box flex={1} paddingLeft={3}>
                    <Text size={1}>
                      <label htmlFor={`col-visibility-${column.id}`}>
                        {column.columnDef.header?.toString()}
                      </label>
                    </Text>
                  </Box>
                </Flex>
              ))}
            {isVisibleLimitReached && (
              <Card
                padding={2}
                style={{position: 'sticky', bottom: 0}}
                radius={2}
                shadow={1}
                tone="caution"
              >
                <Text size={1}>You may only have {VISIBLE_COLUMN_LIMIT} columns visible</Text>
              </Card>
            )}
          </Stack>
        </Menu>
      }
      placement="bottom"
      popover={{portal: true}}
    />
  )
}
