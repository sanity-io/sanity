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

import {Button, TooltipDelayGroupProvider} from '../../../ui-components'

export function DocumentSheetPaginator({
  page,
  setPage,
  totalPages,
}: {
  page: number
  setPage: (page: number) => void
  totalPages: number
}) {
  return (
    <TooltipDelayGroupProvider>
      <Flex gap={3} align={'center'}>
        <Button
          onClick={() => setPage(1)}
          disabled={page === 1}
          icon={DoubleChevronLeftIcon}
          tooltipProps={{
            content: 'Go to first page',
          }}
        />
        <Button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          icon={ChevronLeftIcon}
          tooltipProps={{
            content: 'Go to previous page',
          }}
        />
        <Text style={{whiteSpace: 'nowrap'}}>{`Page ${page} of ${totalPages}`}</Text>

        <Button
          onClick={() => setPage(page + 1)}
          icon={ChevronRightIcon}
          disabled={page === totalPages}
          tooltipProps={{
            content: 'Go to next page',
          }}
        />
        <Button
          onClick={() => setPage(totalPages)}
          icon={DoubleChevronRightIcon}
          disabled={page === totalPages}
          tooltipProps={{
            content: 'Go to last page',
          }}
        />
      </Flex>
    </TooltipDelayGroupProvider>
  )
}
