'use no memo'
// The `use no memo` directive is due to a known issue with react-table and react compiler: https://github.com/TanStack/table/issues/5567

import {Box, Checkbox, Flex, Menu, Stack, Text} from '@sanity/ui'
import {type Column, type Table} from '@tanstack/react-table'
import {useCallback} from 'react'
import {type SanityDocument, useTranslation} from 'sanity'

import {Button, MenuButton} from '../../../../ui-components'
import {VISIBLE_COLUMN_LIMIT} from './useDocumentSheetColumns'

type ColumnsControlProps = {
  table: Table<SanityDocument>
}

export function ColumnsControl({table}: ColumnsControlProps) {
  const {t} = useTranslation()
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
      button={<Button mode="bleed" text={t('sheet-list.edit-columns')} />}
      id="columns-control"
      menu={
        <Menu padding={3} paddingTop={4} style={{width: 240}}>
          <Flex direction="column" height="fill" gap={3}>
            <Text weight="semibold" size={1}>
              {t('sheet-list.select-fields')}
            </Text>
            <Flex style={{flex: '1 1 auto', maxHeight: 320, overflowY: 'scroll'}}>
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
              </Stack>
            </Flex>
            <Button
              width="fill"
              mode="ghost"
              text={t('sheet-list.reset-columns')}
              onClick={setInitialColumns}
            />
          </Flex>
        </Menu>
      }
      placement="bottom"
      popover={{portal: true}}
    />
  )
}
