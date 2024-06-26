import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DoubleChevronLeftIcon,
  DoubleChevronRightIcon,
} from '@sanity/icons'
import {Flex, Text} from '@sanity/ui'
import {useTranslation} from 'sanity'

import {Button, TooltipDelayGroupProvider} from '../../../../ui-components'
import {SheetListLocaleNamespace} from './i18n'
import {type DocumentSheetListTable} from './types'

export function DocumentSheetListPaginator({table}: {table: DocumentSheetListTable}) {
  const {t} = useTranslation(SheetListLocaleNamespace)

  return (
    <TooltipDelayGroupProvider>
      <Flex gap={3} align={'center'}>
        <Button
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
          icon={DoubleChevronLeftIcon}
          tooltipProps={{
            content: t('pagination.first-page.tooltip'),
          }}
        />
        <Button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          icon={ChevronLeftIcon}
          tooltipProps={{
            content: t('pagination.previous-page.tooltip'),
          }}
        />
        <Text style={{whiteSpace: 'nowrap'}}>
          {t('pagination.page-count-label', {
            currentPage: table.getState().pagination.pageIndex + 1,
            pageCount: table.getPageCount(),
          })}
        </Text>

        <Button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          icon={ChevronRightIcon}
          tooltipProps={{
            content: t('pagination.next-page.tooltip'),
          }}
        />
        <Button
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
          icon={DoubleChevronRightIcon}
          tooltipProps={{
            content: t('pagination.last-page.tooltip'),
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
