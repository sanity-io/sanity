/* eslint-disable @sanity/i18n/no-attribute-string-literals */
/* eslint-disable i18next/no-literal-string */
import {Box, Button, Card, Checkbox, Flex, Menu, MenuButton, Stack, Text} from '@sanity/ui'
import {type Column, type Table} from '@tanstack/react-table'
import {useCallback} from 'react'
import {type SanityDocument} from 'sanity'

import {VISIBLE_COLUMN_LIMIT} from './useDocumentSheetColumns'

type ColumnsControlProps = {
  table: Table<SanityDocument>
}

export function ColumnsControl({table}: ColumnsControlProps) {
  const isVisibleLimitReached =
    table.getVisibleLeafColumns().filter((col) => col.getCanHide()).length >= VISIBLE_COLUMN_LIMIT

  const setInitialColumns = useCallback(() => {
    table.resetColumnVisibility()
  }, [table])

  const handleColumnOnChange = (column: Column<SanityDocument, unknown>) => () => {
    column.toggleVisibility()
  }

  const getColumnVisibilityDisabled = (column: Column<SanityDocument, unknown>) => {
    const isColumnVisible = column.getIsVisible()
    const isSingleColumnVisible =
      table.getVisibleLeafColumns().filter((col) => col.getCanHide()).length === 1

    return (isVisibleLimitReached && !isColumnVisible) || (isSingleColumnVisible && isColumnVisible)
  }

  return (
    <MenuButton
      button={<Button text="Columns" />}
      id="columns-control"
      menu={
        <Menu padding={3} paddingBottom={1} style={{maxHeight: 300, overflow: 'scroll'}}>
          <Button size={0} text="Reset" onClick={setInitialColumns} />
          <Stack>
            {table
              .getAllLeafColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <Flex key={column.id} marginY={2} align="center">
                  <Checkbox
                    readOnly={getColumnVisibilityDisabled(column)}
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
