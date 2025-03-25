'use no memo'
// The `use no memo` directive is due to a known issue with react-virtual and react compiler: https://github.com/TanStack/virtual/issues/736

import {Box, Card, type CardProps, Flex, rem, Stack, Text, useTheme} from '@sanity/ui'
import {
  defaultRangeExtractor,
  type Range,
  useVirtualizer,
  type VirtualItem,
} from '@tanstack/react-virtual'
import {isValid} from 'date-fns'
import {get} from 'lodash'
import {
  type CSSProperties,
  Fragment,
  type HTMLProps,
  type MutableRefObject,
  type RefAttributes,
  type RefObject,
  useMemo,
  useRef,
} from 'react'

import {TooltipDelayGroupProvider} from '../../../../../ui-components'
import {TableHeader} from './TableHeader'
import {TableProvider, type TableSort, useTableContext} from './TableProvider'
import {type Column} from './types'

type RowDatum<TableData, AdditionalRowTableData> = (AdditionalRowTableData extends undefined
  ? TableData
  : TableData & AdditionalRowTableData) & {isLoading?: boolean}

export type TableRowProps = Omit<
  CardProps & Omit<HTMLProps<HTMLDivElement>, 'height' | 'as'>,
  'ref'
> &
  RefAttributes<HTMLDivElement>

type VirtualDatum = {
  virtualRow: VirtualItem
  index: number
  isFirst: boolean
  isLast: boolean
}

export interface TableProps<TableData, AdditionalRowTableData> {
  columnDefs: Column<RowDatum<TableData, AdditionalRowTableData>>[]
  searchFilter?: (data: TableData[], searchTerm: string) => TableData[]
  data: TableData[]
  emptyState: (() => React.JSX.Element) | string
  loading?: boolean
  /**
   * Should be the dot separated path to the unique identifier of the row. e.g. document._id
   */
  rowId: string
  rowActions?: ({
    datum,
  }: {
    datum: RowDatum<TableData, AdditionalRowTableData> | unknown
  }) => React.ReactNode
  rowProps?: (datum: TableData) => Partial<TableRowProps>
  scrollContainerRef: RefObject<HTMLDivElement | null>
  hideTableInlinePadding?: boolean
}

const ITEM_HEIGHT = 59
const LOADING_ROW_COUNT = 3

/**
 * This function modifies the rangeExtractor to account for the offset of the virtualizer
 * in this case, the parent with overflow (the element over which the scroll happens) and the start of the virtualizer
 * don't match, because there are some elements rendered on top of the virtualizer.
 * This, will take care of adding more elements to the start of the virtualizer to account for the offset.
 */
const withVirtualizerOffset = ({
  scrollContainerRef,
  virtualizerContainerRef,
  range,
}: {
  scrollContainerRef: MutableRefObject<HTMLDivElement | null>
  virtualizerContainerRef: MutableRefObject<HTMLDivElement | null>
  range: Range
}) => {
  const parentOffset = scrollContainerRef.current?.offsetTop ?? 0
  const virtualizerOffset = virtualizerContainerRef.current?.offsetTop ?? 0
  const virtualizerScrollMargin = virtualizerOffset - parentOffset
  const topItemsOffset = Math.ceil(virtualizerScrollMargin / ITEM_HEIGHT)
  const startIndexWithOffset = range.startIndex - topItemsOffset
  const result = defaultRangeExtractor({
    ...range,
    // By modifying the startIndex, we are adding more elements to the start of the virtualizer
    startIndex: startIndexWithOffset > 0 ? startIndexWithOffset : 0,
  })
  return result
}
const TableInner = <TableData, AdditionalRowTableData>({
  columnDefs,
  data,
  emptyState,
  searchFilter,
  rowId,
  rowActions,
  loading = false,
  rowProps = () => ({}),
  scrollContainerRef,
  hideTableInlinePadding = false,
}: TableProps<TableData, AdditionalRowTableData>) => {
  const {searchTerm, sort} = useTableContext()
  const virtualizerContainerRef = useRef<HTMLDivElement | null>(null)
  const filteredData = useMemo(() => {
    const filteredResult = searchTerm && searchFilter ? searchFilter(data, searchTerm) : data
    if (!sort) return filteredResult

    const sortColumn = columnDefs.find((column) => column.id === sort.column)
    return [...filteredResult].sort((a, b) => {
      let order: number

      const [aValue, bValue]: (number | string)[] = [a, b].map(
        (sortValue) =>
          sortColumn?.sortTransform?.(
            sortValue as RowDatum<TableData, AdditionalRowTableData>,
            sort.direction,
          ) ?? get(sortValue, sort.column),
      )
      if (
        typeof aValue === 'string' &&
        typeof bValue === 'string' &&
        !isValid(aValue) &&
        !isValid(bValue)
      ) {
        order = aValue.toLowerCase().localeCompare(bValue.toLowerCase())
      } else {
        const parseDate = (datum: number | string) => {
          if (sortColumn?.sortTransform && typeof datum === 'number') return datum

          return typeof datum === 'string' ? Date.parse(datum) : 0
        }

        const [aDate, bDate] = [aValue, bValue].map(parseDate)

        order = aDate - bDate
      }

      if (sort.direction === 'asc') return order
      return -order
    })
  }, [columnDefs, data, searchFilter, searchTerm, sort])

  const rowVirtualizer = useVirtualizer({
    count: filteredData.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 5,
    rangeExtractor: (range) =>
      withVirtualizerOffset({scrollContainerRef, virtualizerContainerRef, range}),
  })

  const rowActionColumnDef: Column = useMemo(
    () => ({
      id: 'actions',
      sorting: false,
      width: 50,
      header: ({headerProps: {id}}) => (
        <Flex as="th" id={id} paddingY={3} paddingX={3} sizing="border" style={{width: '50px'}}>
          <Text muted size={1} weight="medium">
            &nbsp;
          </Text>
        </Flex>
      ),
      cell: ({datum, cellProps: {id}}) => (
        <Flex as="td" id={id} align="center" flex="none" padding={3} style={{width: '25px'}}>
          {(!datum.isLoading && rowActions?.({datum})) || <Box style={{width: '25px'}} />}
        </Flex>
      ),
    }),
    [rowActions],
  )

  const amalgamatedColumnDefs = useMemo(
    () =>
      (rowActions ? [...columnDefs, rowActionColumnDef] : columnDefs).filter(
        (column) => !column.hidden,
      ),
    [columnDefs, rowActionColumnDef, rowActions],
  )

  const renderRow = useMemo(
    () =>
      function TableRow(
        datum: VirtualDatum &
          (TableData | (TableData & AdditionalRowTableData) | {_id: string; isLoading: boolean}),
      ) {
        const cardRowProps = rowProps(datum as TableData)
        const cardKey = loading ? `skeleton-${datum.index}` : String(get(datum, rowId))

        return (
          <Card
            key={cardKey}
            data-testid="table-row"
            as="tr"
            borderBottom
            display="flex"
            style={{
              height: `${datum.virtualRow.size}px`,
              transform: `translateY(${datum.virtualRow.start - datum.index * datum.virtualRow.size}px)`,
              paddingInline: `max(
                calc((100% - var(--maxInlineSize)) / 2),
                var(--paddingInline)
              )`,
            }}
            {...cardRowProps}
          >
            {amalgamatedColumnDefs.map(({cell: Cell, style, width, id, sorting = false}) => (
              <Fragment key={String(id)}>
                <Cell
                  datum={
                    {...datum, isLoading: loading} as RowDatum<TableData, AdditionalRowTableData>
                  }
                  cellProps={{
                    as: 'td',
                    id: String(id),
                    style: {...style, width: width || undefined},
                  }}
                  sorting={sorting}
                />
              </Fragment>
            ))}
          </Card>
        )
      },
    [amalgamatedColumnDefs, loading, rowId, rowProps],
  )

  const emptyContent = useMemo(() => {
    if (typeof emptyState === 'string') {
      return (
        <Card
          as="tr"
          borderBottom
          display="flex"
          padding={4}
          style={{
            justifyContent: 'center',
          }}
        >
          <Text as="td" muted size={1}>
            {emptyState}
          </Text>
        </Card>
      )
    }
    return emptyState()
  }, [emptyState])

  const headers = useMemo(
    () =>
      amalgamatedColumnDefs.map(({cell, sortTransform, ...header}) => ({
        ...header,
        id: String(header.id),
      })),
    [amalgamatedColumnDefs],
  )

  const theme = useTheme()

  const maxInlineSize = (!hideTableInlinePadding && theme.sanity.v2?.container[3]) || 0

  const renderLoadingRows = (
    rowRenderer: (
      datum: VirtualDatum &
        ({_id: string; isLoading: boolean} | TableData | (TableData & AdditionalRowTableData)),
    ) => React.ReactNode,
  ) => {
    return Array.from({length: LOADING_ROW_COUNT}).map((el, index) => {
      const cardKey = `skeleton-${index}`
      const virtualRow: VirtualItem = {
        index,
        start: index * ITEM_HEIGHT,
        size: ITEM_HEIGHT,
        lane: 0,
        key: cardKey,
        end: index * ITEM_HEIGHT + ITEM_HEIGHT,
      }

      return rowRenderer({
        _id: cardKey,
        isLoading: true,
        virtualRow,
        index,
        isFirst: index === 0,
        isLast: index === LOADING_ROW_COUNT - 1,
      })
    })
  }

  const tableContent = () => {
    if (loading) {
      return renderLoadingRows(renderRow)
    }

    if (filteredData.length === 0) {
      return emptyContent
    }

    return rowVirtualizer.getVirtualItems().map((virtualRow, index) => {
      const datum = filteredData[virtualRow.index]
      return renderRow({
        ...datum,
        virtualRow,
        index,
        isFirst: virtualRow.index === 0,
        isLast: virtualRow.index === filteredData.length - 1,
      })
    })
  }

  return (
    <div ref={virtualizerContainerRef}>
      <div
        style={
          {
            'width': '100%',
            'position': 'relative',
            '--maxInlineSize': rem(maxInlineSize),
            '--paddingInline': rem(theme.sanity.v2?.space[3] ?? 0),
          } as CSSProperties
        }
      >
        <Stack as="table">
          <TableHeader
            headers={headers}
            searchDisabled={loading || (!searchTerm && !data.length)}
          />
          <Stack as="tbody">{tableContent()}</Stack>
        </Stack>
      </div>
    </div>
  )
}

export const Table = <TableData, AdditionalRowTableData = undefined>({
  defaultSort,
  ...props
}: TableProps<TableData, AdditionalRowTableData> & {defaultSort?: TableSort}) => {
  return (
    <TooltipDelayGroupProvider>
      <TableProvider defaultSort={defaultSort}>
        <TableInner<TableData, AdditionalRowTableData> {...props} />
      </TableProvider>
    </TooltipDelayGroupProvider>
  )
}
