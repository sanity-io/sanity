import {Box, Button, Card, Checkbox, Flex, Menu, MenuButton, Stack, Text} from '@sanity/ui'
import {type Table} from '@tanstack/react-table'
import {useEffect, useRef} from 'react'
import {type SanityDocument} from 'sanity'

const VISIBLE_COLUMN_LIMIT = 5

type Props = {
  table: Table<SanityDocument>
}

export function ColumnsControl({table}: Props) {
  const tableRef = useRef(table)

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
  }, [])

  return (
    <MenuButton
      button={<Button text="Columns" />}
      id="columns-control"
      menu={
        <Menu padding={3} paddingBottom={1} style={{maxHeight: 300, overflow: 'scroll'}}>
          <Stack>
            {table.getAllLeafColumns().map((column) => (
              <Flex key={column.id} marginY={2} align="center">
                <Checkbox
                  readOnly={
                    !column.getCanHide() || (isVisibleLimitReached && !column.getIsVisible())
                  }
                  checked={column.getIsVisible()}
                  onChange={(e) => {
                    column.toggleVisibility()
                    e.stopPropagation()
                  }}
                  id="checkbox"
                  style={{display: 'block'}}
                />
                <Box flex={1} paddingLeft={3}>
                  <Text size={1}>
                    <label htmlFor="checkbox">{column.columnDef.header}</label>
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
