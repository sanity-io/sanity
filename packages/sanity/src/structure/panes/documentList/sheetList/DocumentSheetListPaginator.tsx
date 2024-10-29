'use no memo'
// The `use no memo` directive is due to a known issue with react-table and react compiler: https://github.com/TanStack/table/issues/5567

/* eslint-disable i18next/no-literal-string */
/* eslint-disable @sanity/i18n/no-attribute-string-literals */
/* eslint-disable react/jsx-no-bind */
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DoubleChevronLeftIcon,
  DoubleChevronRightIcon,
} from '@sanity/icons'
import {Flex, Text} from '@sanity/ui'
import {type Table} from '@tanstack/react-table'
import {type SanityDocument} from 'sanity'

import {Button, TooltipDelayGroupProvider} from '../../../../ui-components'

export function DocumentSheetListPaginator({table}: {table: Table<SanityDocument>}) {
  return (
    <TooltipDelayGroupProvider>
      <Flex gap={3} align={'center'}>
        <Button
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
          icon={DoubleChevronLeftIcon}
          tooltipProps={{
            content: 'Go to first page',
          }}
        />
        <Button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          icon={ChevronLeftIcon}
          tooltipProps={{
            content: 'Go to previous page',
          }}
        />
        <Text style={{whiteSpace: 'nowrap'}}>
          {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </Text>

        <Button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          icon={ChevronRightIcon}
          tooltipProps={{
            content: 'Go to next page',
          }}
        />
        <Button
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
          icon={DoubleChevronRightIcon}
          tooltipProps={{
            content: 'Go to last page',
          }}
        />
        <select
          value={table.getState().pagination.pageSize}
          onChange={(e) => {
            table.setPageSize(Number(e.target.value))
          }}
        >
          {[25, 50, 100].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              {pageSize}
            </option>
          ))}
        </select>
      </Flex>
    </TooltipDelayGroupProvider>
  )
}
